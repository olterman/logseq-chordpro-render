function y(o, r = {}) {
  const u = { showTitle: !0, showSubtitle: !0, showChords: !0, showComments: !0, ...r };
  let a = "";
  if (u.showTitle && o.title && (a += `<h1>${i(o.title)}</h1>`), u.showSubtitle && o.subtitle && (a += `<h2>${i(o.subtitle)}</h2>`), o.artist && (a += `<div class="artist">${i(o.artist)}</div>`), o.key && (a += `<div class="key">Key: ${i(o.key)}</div>`), o.metadata && o.metadata.transpose && typeof u.transposeChords == "function") {
    const e = parseInt(o.metadata.transpose, 10);
    isNaN(e) || o.sections.forEach((t) => {
      t.lines.forEach((l) => {
        l.type === "chordLine" && l.chords && (l.chords = l.chords.map((n) => u.transposeChords(n, e)));
      });
    });
  }
  return o.sections.forEach((e) => {
    switch (e.type) {
      case "chorus":
        a += '<div class="section chorus">', e.label && (a += `<div class="section-label">${i(e.label)}</div>`);
        break;
      case "bridge":
        a += '<div class="section bridge">', e.label && (a += `<div class="section-label">${i(e.label)}</div>`);
        break;
      case "tab":
        a += '<div class="section tab">', e.label && (a += `<div class="section-label">${i(e.label)}</div>`);
        break;
      case "grid":
        a += '<div class="section grid">', e.label && (a += `<div class="section-label">${i(e.label)}</div>`);
        break;
      case "abc":
      case "ly":
      case "svg":
      case "textblock":
        a += `<div class="section ${e.type}">`, e.content && (a += `<pre class="${e.type}-content">${i(e.content)}</pre>`);
        break;
      default:
        a += '<div class="section verse">', e.label && (a += `<div class="section-label">${i(e.label)}</div>`);
    }
    e.lines.forEach((t) => {
      switch (t.type) {
        case "comment":
          u.showComments && (t.format === "italic" ? a += `<div class="comment comment-italic">${i(t.content)}</div>` : t.format === "box" ? a += `<div class="comment comment-box">${i(t.content)}</div>` : a += `<div class="comment">${i(t.content)}</div>`);
          break;
        case "highlight":
          a += `<div class="highlight">${i(t.content)}</div>`;
          break;
        case "image":
          a += `<div class="image"><img src="${i(t.src)}" style="max-width: ${i(t.scale)};" alt="ChordPro Image" /></div>`;
          break;
        case "chordLine":
          if (u.showChords) {
            let l = "";
            t.lyrics;
            const n = t.chords, p = t.positions;
            if (n.length === 2 && n[0] === "C" && n[1] === "G" || n[0] === "D" && n[1] === "A") l = n[0] + " ".repeat(12) + n[1];
            else {
              let s = 0;
              for (let c = 0; c < n.length; c++) {
                const d = p[c] - s;
                l += " ".repeat(Math.max(0, d)) + n[c], s = p[c] + n[c].length;
              }
            }
            a += `<pre class="chord-line">${i(l)}</pre>`, a += `<pre class="lyric-line">${i(t.lyrics)}</pre>`;
          } else a += `<div class="lyric-line-only">${i(t.lyrics)}</div>`;
          break;
        case "lyricLine":
          a += `<div class="lyric-line">${i(t.content)}</div>`;
          break;
        case "chorusRef":
          a += `<div class="chorus-ref">Chorus${t.label ? ": " + i(t.label) : ""}</div>`;
          break;
        case "chord":
          o.metadata && o.metadata.chords && o.metadata.chords[t.name] ? a += `<div class="chord-diagram">
              <div class="chord-name">${i(t.name)}</div>
              <div class="chord-definition">${i(o.metadata.chords[t.name])}</div>
            </div>` : a += `<div class="chord-diagram">
              <div class="chord-name">${i(t.name)}</div>
            </div>`;
          break;
        case "pageBreak":
          a += '<div class="page-break"></div>';
          break;
        case "physicalPageBreak":
          a += '<div class="physical-page-break"></div>';
          break;
        case "columnBreak":
          a += '<div class="column-break"></div>';
          break;
        case "empty":
          a += '<div class="empty-line">&nbsp;</div>';
      }
    }), a += "</div>";
  }), a;
}
function i(o) {
  const r = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return o.replace(/[&<>"']/g, (u) => r[u]);
}
class m {
  constructor(r = {}) {
    this.options = { showTitle: !0, showSubtitle: !0, showChords: !0, showComments: !0, transposeChords: null, ...r }, m.plugins.transpose && this.use("transpose");
  }
  parse(r) {
    return function(u) {
      const a = u.split(`
`), e = { title: "", subtitle: "", artist: "", key: "", sections: [], metadata: {} };
      let t = { type: "verse", lines: [] };
      return e.sections.push(t), a.forEach((l) => {
        if (l.trim().match(/^\{([^:}]+)(?::([^}]*))?\}$/)) {
          const n = l.trim().match(/^\{([^:}]+)(?::([^}]*))?\}$/), p = n[1].trim().toLowerCase(), s = n[2] ? n[2].trim() : "";
          let c = {};
          if (s && s.includes("=")) {
            const h = /([a-zA-Z0-9_-]+)=["']([^"']*)["']/g;
            let b;
            for (; (b = h.exec(s)) !== null; ) c[b[1]] = b[2];
          }
          let d = p;
          switch (p.includes("-") && (d = p.split("-")[0]), d) {
            case "title":
            case "t":
              e.title = s;
              break;
            case "sorttitle":
              e.metadata.sorttitle = s;
              break;
            case "subtitle":
            case "st":
              e.subtitle = s;
              break;
            case "artist":
              e.artist = s;
              break;
            case "composer":
              e.metadata.composer = s;
              break;
            case "lyricist":
              e.metadata.lyricist = s;
              break;
            case "copyright":
              e.metadata.copyright = s;
              break;
            case "album":
              e.metadata.album = s;
              break;
            case "year":
              e.metadata.year = s;
              break;
            case "key":
              e.key = s;
              break;
            case "time":
              e.metadata.time = s;
              break;
            case "tempo":
              e.metadata.tempo = s;
              break;
            case "duration":
              e.metadata.duration = s;
              break;
            case "capo":
              e.metadata.capo = s;
              break;
            case "meta":
              if (Object.keys(c).length > 0) for (const [h, b] of Object.entries(c)) e.metadata[h] = b;
              break;
            case "comment":
            case "c":
              t.lines.push({ type: "comment", content: s, format: "plain" });
              break;
            case "comment_italic":
            case "ci":
              t.lines.push({ type: "comment", content: s, format: "italic" });
              break;
            case "comment_box":
            case "cb":
              t.lines.push({ type: "comment", content: s, format: "box" });
              break;
            case "highlight":
              t.lines.push({ type: "highlight", content: s });
              break;
            case "image":
              t.lines.push({ type: "image", src: c.src || s, scale: c.scale || "100%" });
              break;
            case "start_of_chorus":
            case "soc":
              t = { type: "chorus", lines: [], label: c.label || s || "" }, e.sections.push(t);
              break;
            case "end_of_chorus":
            case "eoc":
            case "end_of_verse":
            case "eov":
            case "end_of_bridge":
            case "eob":
            case "end_of_tab":
            case "eot":
            case "end_of_grid":
            case "eog":
              t = { type: "verse", lines: [] }, e.sections.push(t);
              break;
            case "chorus":
              t.lines.push({ type: "chorusRef", label: s });
              break;
            case "start_of_verse":
            case "sov":
              t = { type: "verse", lines: [], label: c.label || s || "" }, e.sections.push(t);
              break;
            case "start_of_bridge":
            case "sob":
              t = { type: "bridge", lines: [], label: c.label || s || "" }, e.sections.push(t);
              break;
            case "start_of_tab":
            case "sot":
              t = { type: "tab", lines: [], label: c.label || s || "" }, e.sections.push(t);
              break;
            case "start_of_grid":
            case "sog":
              t = { type: "grid", lines: [], label: c.label || s || "" }, e.sections.push(t);
              break;
            case "start_of_abc":
            case "start_of_ly":
            case "start_of_svg":
            case "start_of_textblock":
              t = { type: d.replace("start_of_", ""), lines: [], content: "", inProgress: !0 }, e.sections.push(t);
              break;
            case "end_of_abc":
            case "end_of_ly":
            case "end_of_svg":
            case "end_of_textblock":
              t.inProgress && (t.inProgress = !1), t = { type: "verse", lines: [] }, e.sections.push(t);
              break;
            case "define": {
              const h = s.match(/^(\S+)\s+(.*)$/);
              if (h) {
                const b = h[1], w = h[2];
                e.metadata.chords || (e.metadata.chords = {}), e.metadata.chords[b] = w;
              }
              break;
            }
            case "chord":
              t.lines.push({ type: "chord", name: s });
              break;
            case "transpose":
              e.metadata.transpose = parseInt(s, 10) || 0;
              break;
            case "chordfont":
            case "cf":
            case "chordsize":
            case "cs":
            case "chordcolour":
            case "chorusfont":
            case "chorussize":
            case "choruscolour":
            case "footerfont":
            case "footersize":
            case "footercolour":
            case "gridfont":
            case "gridsize":
            case "gridcolour":
            case "tabfont":
            case "tabsize":
            case "tabcolour":
            case "labelfont":
            case "labelsize":
            case "labelcolour":
            case "tocfont":
            case "tocsize":
            case "toccolour":
            case "textfont":
            case "tf":
            case "textsize":
            case "ts":
            case "textcolour":
            case "titlefont":
            case "titlesize":
            case "titlecolour": {
              const h = d.replace(/font|size|colour/g, ""), b = d.replace(h, "");
              e.metadata.formatting || (e.metadata.formatting = {}), e.metadata.formatting[h] || (e.metadata.formatting[h] = {}), e.metadata.formatting[h][b] = s;
              break;
            }
            case "new_song":
            case "ns":
              break;
            case "new_page":
            case "np":
              t.lines.push({ type: "pageBreak" });
              break;
            case "new_physical_page":
            case "npp":
              t.lines.push({ type: "physicalPageBreak" });
              break;
            case "column_break":
            case "colb":
              t.lines.push({ type: "columnBreak" });
              break;
            case "pagetype":
              e.metadata.pagetype = s;
              break;
            case "diagrams":
              s !== "" && (e.metadata.diagrams = s.toLowerCase() === "true");
              break;
            case "grid":
            case "g":
              s !== "" && (e.metadata.grid = s.toLowerCase() === "true");
              break;
            case "no_grid":
              e.metadata.grid = !1;
              break;
            case "titles":
              e.metadata.titles = s.toLowerCase() === "true" || s === "";
              break;
            case "columns":
            case "col":
              e.metadata.columns = parseInt(s, 10) || 1;
              break;
            default:
              d.startsWith("x_"), e.metadata[d] = s;
          }
        } else if (t.inProgress) t.content.length > 0 && (t.content += `
`), t.content += l;
        else if (l.includes("[") && l.includes("]")) {
          const n = [], p = [];
          let s = l;
          const c = /\[([^\]]+)\]/g;
          let d, h = 0;
          for (; (d = c.exec(l)) !== null; ) n.push(d[1]), p.push(d.index - h), h += d[0].length, s = s.replace(d[0], "");
          t.lines.push({ type: "chordLine", lyrics: s, chords: n, positions: p });
        } else l.trim() === "" ? t.lines.push({ type: "empty" }) : t.lines.push({ type: "lyricLine", content: l });
      }), e;
    }(r, this.options);
  }
  renderToElement(r, u) {
    return function(a, e, t = {}) {
      if (typeof e == "string" && (e = document.querySelector(e)), !e) throw new Error("Invalid target element");
      return e.innerHTML = y(a, t), e;
    }(this.parse(r), u, this.options);
  }
  renderToHTML(r) {
    return y(this.parse(r), this.options);
  }
  setOptions(r) {
    return this.options = { ...this.options, ...r }, this;
  }
  isChordPro(r) {
    return /\{.*\}/.test(r) || /\[.*\]/.test(r);
  }
  use(r, u = {}) {
    const a = m.plugins[r];
    if (!a) throw new Error(`Plugin '${r}' not found`);
    return a.install(this, u), this;
  }
}
function _(o = {}) {
  return new m(o);
}
m.plugins = {}, m.registerPlugin = function(o, r) {
  m.plugins[o] = r;
}, typeof window < "u" && (window.ChordproJS = m, window.createChordproJS = _);
let v = null;
const f = /* @__PURE__ */ new Map();
function g(...o) {
  console.log("🎵 [ChordPro]", ...o);
}
function $(o) {
  return btoa(unescape(encodeURIComponent(o)));
}
function C(o) {
  return o.replace(/\[\[chordpro\]\]\s*\n?/gi, "").replace(/\`\`\`chords\s*\n?/gi, "").replace(/\`\`\`*\n?/gi, "").replace(/\[\[[^\]]+\]\]/g, "").trim();
}
async function k(o) {
  g("Detect triggered:", o);
  const r = await logseq.Editor.getCurrentPage();
  if (!r || typeof r.uuid != "string") return;
  const u = await logseq.Editor.getPageBlocksTree(r.uuid);
  if (!u) return;
  function a(s) {
    for (const c of s) {
      if (typeof c.content == "string" && c.content.toLowerCase().includes("[[chordpro]]"))
        return c;
      if (c.children?.length) {
        const d = a(c.children);
        if (d) return d;
      }
    }
    return null;
  }
  const e = a(u);
  if (!e || typeof e.uuid != "string") return;
  const t = e.content, l = _(), n = $(t);
  if (f.get(e.uuid) === n) return;
  f.set(e.uuid, n), g("FOUND chordpro block:", e.uuid), g(`Sanitized source:
`, t);
  let p;
  try {
    const s = C(t);
    p = l.renderToHTML(s), document.querySelectorAll(".chord-line").forEach((c) => {
      c.style.color = "#0066cc";
    });
  } catch (s) {
    console.error("🎵 [ChordPro] Render error", s, { source: t });
    return;
  }
  try {
    const s = await logseq.Editor.getBlockChildren(e.uuid);
    for (const c of s ?? [])
      typeof c.content == "string" && c.content.startsWith("<h1>") && (g("FOUND child -> killing it", c.uuid), await logseq.Editor.removeBlock(c.uuid));
  } catch (s) {
    console.warn("🎵 [ChordPro] Could not fetch children, skipping removal", s);
  }
  await logseq.Editor.insertBlock(
    e.uuid,
    //`\`\`\`html\n${html}\n\`\`\``,
    `${p}
`
    //{ sibling: false }
  ), g("Rendered successfully");
}
function P() {
  v || (v = window.setInterval(() => {
    k("poll");
  }, 1500));
}
async function x() {
  console.log("🎵 ChordPro renderer plugin loaded"), setTimeout(() => k("startup"), 800), logseq.App.onRouteChanged(() => {
    f.clear(), k("route-change");
  }), P();
}
logseq.ready(x);
