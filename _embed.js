// Regenera el CSS y JS incrustados en cada HTML. Fuente: assets/css/main.css + assets/js/*.js
// Uso: node _embed.js
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const JS_DIR = path.join(ROOT, "assets", "js");
const CSS_PATH = path.join(ROOT, "assets", "css", "main.css");
const MAIN_JS = path.join(JS_DIR, "main.js");
const PARTS = [
  MAIN_JS,
  path.join(JS_DIR, "gradient-waves.js"),
  path.join(JS_DIR, "logos-carousel.js"),
  path.join(JS_DIR, "reviews-carousel.js"),
];

function splitChromeFromBundle() {
  let main = fs.readFileSync(MAIN_JS, "utf8");
  const idx = main.indexOf("\n(function () {\n  const vertex");
  if (idx !== -1) {
    main = main.slice(0, idx).trimEnd() + "\n";
    fs.writeFileSync(MAIN_JS, main, "utf8");
  }
}

function bundleJs() {
  splitChromeFromBundle();
  return PARTS.map((p) => fs.readFileSync(p, "utf8").trimEnd()).join("\n\n") + "\n";
}

function wrapStyle(css) {
  if (/<\/style/i.test(css)) throw new Error("CSS contains </style>");
  return `<!-- jra:css -->\n<style id="jra-css">\n${css}\n</style>\n<!-- /jra:css -->`;
}

function wrapScript(js) {
  return `<!-- jra:js -->\n<script id="jra-js">\n${js.replace(/<\/script/gi, "<\\/script")}\n</script>\n<!-- /jra:js -->`;
}

function replaceMarked(text, start, end, block) {
  const from = text.indexOf(start);
  const to = text.indexOf(end);
  if (from === -1 || to === -1 || to < from) return null;
  return text.slice(0, from) + block + text.slice(to + end.length);
}

function indentBlock(block, spaces) {
  const pad = " ".repeat(spaces);
  return block.split("\n").map((line) => (line ? pad + line : line)).join("\n");
}

function embedHtml(cssBlock, jsBlock) {
  const files = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html"));
  for (const name of files) {
    const htmlPath = path.join(ROOT, name);
    let text = fs.readFileSync(htmlPath, "utf8");
    const pageMatch = text.match(/<body[^>]*data-page="([^"]+)"/);
    const page = pageMatch ? pageMatch[1] : "";

    text = text.replace(
      /<header class="site-header" id="masthead"(?: data-page="[^"]*")?>/,
      `<header class="site-header" id="masthead" data-page="${page}">`
    );

    if (page === "contacto" || page === "cotizar") {
      text = text.replace('<section class="cta-band">', '<section class="cta-band cta-band--off">');
    }

    text = text.replace(/\s*<link rel="stylesheet" href="\/?assets\/css\/main\.css">/, "");
    text = text.replace(/(src|href)="assets\//g, '$1="/assets/');

    let next = replaceMarked(text, "<!-- jra:css -->", "<!-- /jra:css -->", indentBlock(cssBlock, 2));
    if (next) text = next;
    else text = text.replace(/(<body[^>]*>)/, `$1\n${indentBlock(cssBlock, 2)}`);

    text = text.replace(/(?:\s*<script src="\/?assets\/js\/[^"]+"><\/script>)+/g, "");

    next = replaceMarked(text, "<!-- jra:js -->", "<!-- /jra:js -->", indentBlock(jsBlock, 2));
    if (next) text = next;
    else text = text.replace(/<\/body>/, `${indentBlock(jsBlock, 2)}\n</body>`);

    fs.writeFileSync(htmlPath, text, "utf8");
    console.log("updated", name);
  }
}

const js = bundleJs();
const css = fs.readFileSync(CSS_PATH, "utf8");
embedHtml(wrapStyle(css), wrapScript(js));
console.log("js bytes", js.length, "css bytes", css.length);
console.log("done");
