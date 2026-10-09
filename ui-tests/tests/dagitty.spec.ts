import { expect, IJupyterLabPageFixture, test } from '@jupyterlab/galata';

const DAG_SOURCE = `dag {
"exposure" [exposure,pos="0,0"]
"outcome" [outcome,pos="1,0"]
"exposure" -> "outcome"
}`;

/**
 * Render `source` as a notebook cell output with a fixed pixel height, so
 * the widget's screenshots do not depend on how long the cell took to lay
 * out. Width is left for JupyterLab to size: requesting an explicit width
 * here is unreliable (it can end up considerably wider than asked, likely
 * tied to the notebook's windowed-rendering layout timing), so tests below
 * do not depend on an exact width.
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

test('submits the rename dialog on Enter in a mutable notebook output', async ({
  page,
  tmpPath
}) => {
  // The rename dialog is a plain HTML <form>; JupyterLab's own notebook
  // keydown handling otherwise swallows Enter before the browser submits it
  // (see the comment on `_evtKeyDown` in src/index.ts), so this only
  // exercises the path when dagitty is mutable and runs as a cell output.
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
  // `fitNamesOnDraw` (src/index.ts) measures each node's name with a
  // throwaway <canvas> context, set to the font of an existing
  // `svg text.nodelabel` element, falling back to the widget's own font
  // when none exists yet: `context.font = getComputedStyle(text ?? node).font`.
  // On every draw this test has observed, that element does not exist yet
  // at measurement time, so the fallback always applies. The widget's own
  // font (JupyterLab's DejaVu Sans / Noto Sans SC) measures narrower than
  // the font dagitty actually draws the label in (Arial, set on the <svg>
  // itself), so the computed margin is too small and this snapshot
  // currently shows the long name running past the drawing's right edge.
  // Pinned here as the known, current behaviour; a future font-matching fix
  // should update this snapshot to show the full name instead.
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
  // Dagitty positions the drag from the native MouseEvent.offsetX/offsetY
  // (jtextor/dagitty#64, pulled in via build_dagitty.sh), which is only
  // correct once the container is accounted for the way that commit does
  // it: this is the one interaction that commit was written for, so check
  // it directly rather than trust the upstream fix blindly.
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
  // A loose tolerance: this checks the node follows the pointer by roughly
  // the dragged distance, not that the drag is pixel-exact.
  expect(after.x - before.x).toBeGreaterThan(dx * 0.5);
  expect(after.y - before.y).toBeGreaterThan(dy * 0.5);
});
