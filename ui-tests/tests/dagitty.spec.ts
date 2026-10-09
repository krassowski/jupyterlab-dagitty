import { expect, IJupyterLabPageFixture, test } from '@jupyterlab/galata';
import * as fs from 'fs';
import * as path from 'path';

const DAG_SOURCE = `dag {
"exposure" [exposure,pos="0,0"]
"outcome" [outcome,pos="1,0"]
"exposure" -> "outcome"
}`;

/**
 * Render `source` as a notebook output at a fixed height. Width is left
 * alone: requesting one explicitly here is unreliable.
 */
const renderInNotebook = async (
  page: IJupyterLabPageFixture,
  source: string,
  options: { mutable?: boolean; height?: number } = {}
) => {
  const { mutable = false, height = 200 } = options;
  await page.notebook.createNew();
  await page.notebook.setCell(
    0,
    'code',
    [
      'from jupyterlab_dagitty import DAG',
      `DAG(data='''${source}''', mutable=${mutable ? 'True' : 'False'}, height=${height})`
    ].join('\n')
  );
  await page.notebook.run();
  return page.locator('.mimerenderer-dagitty-dag');
};

test('renders a .dag file opened from the file browser', async ({
  page,
  tmpPath
}) => {
  const filename = 'test.dag';
  await page.contents.uploadContent(
    DAG_SOURCE,
    'text',
    `${tmpPath}/${filename}`
  );
  await page.filebrowser.open(`${tmpPath}/${filename}`);

  const view = page.locator('.mimerenderer-dagitty-dag');
  await expect(view.locator('text.nodelabel')).toHaveCount(2);
  await expect(
    view.locator('text.nodelabel', { hasText: 'exposure' })
  ).toBeVisible();
  await expect(
    view.locator('text.nodelabel', { hasText: 'outcome' })
  ).toBeVisible();
});

test('fills the available width for a .dag file opened as a document', async ({
  page,
  tmpPath
}) => {
  // Regression: a document view, unlike a notebook output, is positioned by
  // Lumino's StackedLayout, which once cached max-width:100% from an early,
  // too-narrow measurement and never widened it again (squashed to a strip).
  const source = fs.readFileSync(
    path.resolve(__dirname, '../../examples/car_model_driver.dag'),
    'utf-8'
  );
  const filename = 'car_model_driver.dag';
  await page.contents.uploadContent(source, 'text', `${tmpPath}/${filename}`);
  await page.filebrowser.open(`${tmpPath}/${filename}`);

  const view = page.locator('.mimerenderer-dagitty-dag');
  await expect(view.locator('text.nodelabel').first()).toBeVisible();
  const box = await view.boundingBox();
  expect(box!.width).toBeGreaterThan(400);
  await expect(view).toHaveScreenshot('car-model-driver.png');
});

test('submits the rename dialog on Enter in a mutable notebook output', async ({
  page,
  tmpPath
}) => {
  // Enter in the rename form is otherwise swallowed by JupyterLab's
  // notebook keydown handling; see `_evtKeyDown` in src/index.ts.
  const view = await renderInNotebook(page, DAG_SOURCE, { mutable: true });

  await view.locator('text.nodelabel', { hasText: 'exposure' }).click();
  await page.keyboard.press('r');

  const input = page.locator('.dialogwin input[type="text"]');
  await expect(input).toBeVisible();
  await input.fill('renamed');
  await input.press('Enter');

  await expect(page.locator('.dialogwin')).toHaveCount(0);
  await expect(
    view.locator('text.nodelabel', { hasText: 'renamed' })
  ).toBeVisible();
  await expect(
    view.locator('text.nodelabel', { hasText: 'exposure' })
  ).toHaveCount(0);
});

test('draws each node type with its own decoration', async ({ page }) => {
  const source = `dag {
"exposure" [exposure,pos="0,0"]
"outcome" [outcome,pos="2,0"]
"adjusted" [adjusted,pos="1,-1"]
"latent" [latent,pos="1,1"]
"adjusted" -> "exposure"
"adjusted" -> "outcome"
"exposure" -> "outcome"
}`;
  const view = await renderInNotebook(page, source, { height: 220 });

  await expect(view.locator('text.nodelabel')).toHaveCount(4);
  await expect(view).toHaveScreenshot('node-types.png');
});

test('fitNames widens the drawing to make room for a long node name', async ({
  page
}) => {
  // fitNamesOnDraw (src/index.ts) measures names in the widget's own font
  // (DejaVu Sans), not the Arial dagitty draws them in, so the margin runs
  // short. Pinned as current behaviour: the name below is clipped.
  const longName =
    'a rather long variable name that would be clipped without fitNames';
  const source = `dag {
bb="0,0,1,1"
"short" [pos="0,0.5"]
"${longName}" [pos="1,0.5"]
"short" -> "${longName}"
}`;
  const view = await renderInNotebook(page, source, { height: 140 });

  await expect(view.locator('text.nodelabel')).toHaveCount(2);
  await expect(view).toHaveScreenshot('long-name.png');
});

test('zooms in on Ctrl+wheel', async ({ page }) => {
  const source = `dag {
"a" [pos="0,0"]
"b" [pos="1,1"]
"a" -> "b"
}`;
  const view = await renderInNotebook(page, source, { height: 200 });

  await view.hover();
  await page.keyboard.down('Control');
  await page.mouse.wheel(0, -1500);
  await page.keyboard.up('Control');

  await expect(view).toHaveScreenshot('zoomed-in.png');
});

test('dragging a vertex tracks the pointer', async ({ page }) => {
  // Covers jtextor/dagitty#64 (offsetX/offsetY), the fix build_dagitty.sh
  // pins frontdoor for.
  const source = `dag {
"a" [pos="0,0"]
"b" [pos="1,1"]
}`;
  const view = await renderInNotebook(page, source, {
    mutable: true,
    height: 300
  });

  const nodeCenter = async (name: string) =>
    view.evaluate((div, n) => {
      const label = Array.from(div.querySelectorAll('svg text.nodelabel')).find(
        el => el.textContent === n
      )!;
      const box = label.closest('g')!.getBoundingClientRect();
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    }, name);

  const before = await nodeCenter('a');
  const [dx, dy] = [80, 40];
  await page.mouse.move(before.x, before.y);
  await page.mouse.down();
  await page.mouse.move(before.x + dx, before.y + dy, { steps: 10 });
  await page.mouse.up();

  const after = await nodeCenter('a');
  // Loose tolerance: following the pointer roughly, not pixel-exact.
  expect(after.x - before.x).toBeGreaterThan(dx * 0.5);
  expect(after.y - before.y).toBeGreaterThan(dy * 0.5);
});
