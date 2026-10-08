import { expect, test } from '@jupyterlab/galata';

const DAG_SOURCE = `dag {
"exposure" [exposure,pos="0,0"]
"outcome" [outcome,pos="1,0"]
"exposure" -> "outcome"
}`;

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
  await page.notebook.createNew();
  await page.notebook.setCell(
    0,
    'code',
    [
      'from jupyterlab_dagitty import DAG',
      `DAG(data='''${DAG_SOURCE}''', mutable=True)`
    ].join('\n')
  );
  await page.notebook.run();

  const view = page.locator('.mimerenderer-dagitty-dag');
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
