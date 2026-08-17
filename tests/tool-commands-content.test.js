const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const markdownPath = path.join(__dirname, '../public/data/tool-commands.md');
const routerPath = path.join(__dirname, '../src/router/index.js');
const homePath = path.join(__dirname, '../src/views/Home.vue');

test('tool commands markdown contains the required category structure', () => {
  const markdown = fs.readFileSync(markdownPath, 'utf8');
  const expectedCategories = [
    '环境与版本检查',
    'Homebrew',
    'mise',
    'Python 与虚拟环境',
    'Node.js、npm、Corepack、pnpm、yarn',
    'JDK 17 与 JDK 25',
    'PostgreSQL',
    'zsh 与本地代理',
  ];
  const h1Headings = markdown.match(/^# .+$/gm) || [];
  const h2Headings = [...markdown.matchAll(/^## (.+)$/gm)].map((match) => match[1]);

  assert.equal(h1Headings.length, 1);
  assert.deepEqual(h2Headings, expectedCategories);
  assert.equal(markdown.endsWith('\n'), true);
});

test('every documented command has a description and a fenced bash block', () => {
  const markdown = fs.readFileSync(markdownPath, 'utf8');
  const entries = [...markdown.matchAll(
    /\*\*([^*\n]+)\*\*\n\n([\s\S]*?)(?=\n\*\*|\n## |\s*$)/g
  )];
  const fence = String.fromCharCode(96).repeat(3);

  assert.ok(entries.length >= 40, 'expected a substantial command reference');

  for (const [, title, body] of entries) {
    const fenceStart = body.indexOf(fence + 'bash');
    const description = fenceStart >= 0 ? body.slice(0, fenceStart).trim() : '';
    const codeBlock = new RegExp(fence + 'bash\\n[\\s\\S]+?\\n' + fence);

    assert.ok(description, title + ' is missing a description');
    assert.match(body, codeBlock, title + ' is missing a fenced bash block');
  }
});

test('router and home expose the commands page as the eleventh tool', () => {
  const routerSource = fs.readFileSync(routerPath, 'utf8');
  const homeSource = fs.readFileSync(homePath, 'utf8');

  assert.match(routerSource, /path:\s*'\/commands'/);
  assert.match(routerSource, /name:\s*'ToolCommands'/);
  assert.match(routerSource, /ToolCommands\.vue/);
  assert.match(homeSource, /index:\s*'11'/);
  assert.match(homeSource, /path:\s*'\/commands'/);
  assert.match(homeSource, /title:\s*'常用命令'/);
});
