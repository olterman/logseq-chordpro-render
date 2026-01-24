// <reference types="@logseq/libs" />
import ChordproJS from 'chordprojs';
import { format } from 'date-fns';
import { LSPluginBaseInfo, SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin'

let pollTimer: number | null = null;
const seenHashes = new Map<string, string>();

function log(...args: any[]) {
  console.log("🎵 [ChordPro]", ...args);
}

// simple content hash for change detection
//function hash(text: string): string {
//  return btoa(unescape(encodeURIComponent(text)));//
//}

// sanitize input:
// - remove [[chordpro]] tag
// - remove other [[links]]
// - remove {comment: ...} tags
// - trim
function sanitizeChordPro(input: string): string {
  return input
    .replace(/\[\[chordpro\]\]\s*\n?/gi, "")
    .replace(/\`\`\`chords\s*\n?/gi, "")
    .replace(/\`\`\`*\n?/gi, "")
    .replace(/\[\[[^\]]+\]\]/g, "")
    //.replace(/\{comment:[^}]*\}/gi, "")
    .trim();
}
const settingsSchema: Array<SettingSchemaDesc> = [
  {
    key: 'playcounter',
    type: 'boolean',
    title: 'Play Counter',
    description: 'counts each time song is played',
    default: true
  }
]
function makeShiny(input: string): string {
  /* CHORDPRO CSS 
  Main CSS Classes
    .chord-line - Applied to chord lines (pre element)
    .lyric-line - Applied to lyric lines (pre element)
*/
  const preStyle = "background:none; padding: 0em 0em 0em 0em; margin: 0em 0 0em 0em;"
  const chordStyle = "color: #c678dd; font-wight: bold;"
  const lyricStyle = "color: #abb2bf;"
    //.lyric-line-only - Applied to lyric lines when chords are hidden
  const commentStyle = "color: #0d3708ff;"  //.comment - Applied to comment lines
    //.comment-italic - Applied to italic comment lines
    //.comment-box - Applied to boxed comment lines
    //.highlight - Applied to highlighted text
    //.section - Applied to all section containers
    //.section-label - Applied to section labels
    //.chorus - Applied to chorus containers
    //.verse - Applied to verse containers
    //.bridge - Applied to bridge sections
    //.tab - Applied to tab sections
    //.grid - Applied to grid sections
    //.abc - Applied to ABC notation sections
    //.ly - Applied to LilyPond notation sections
    //.svg - Applied to SVG content sections
    //.textblock - Applied to text block sections
    //.chorus-ref - Applied to chorus references
    //.chord-diagram - Applied to chord diagrams
    //.chord-name - Applied to chord names in diagrams
    //.chord-definition - Applied to chord definitions in diagrams
    //.page-break - Applied to page breaks
    //.physical-page-break - Applied to physical page breaks
    //.column-break - Applied to column breaks
    //.image - Applied to image containers
    const emptyLineStyle ="background:none; padding: 0em 0em 0em 0em; margin: 0em 0 0em 0em;";
    //.artist - Applied to artist information
    //.key - Applied to key information
  return input
    .replaceAll("<pre class=\"chord-line\">", "<pre class=\"chord-line\" style=\"" + preStyle + chordStyle + "\">")
    .replaceAll("<pre class=\"lyric-line\">", "<pre class=\"lyric-line\" style=\"" + preStyle + lyricStyle + "\">")
    //.lyric-line-only - Applied to lyric lines when chords are hidden
    .replaceAll("<div class=\"comment\">", "<div class=\"comment\" style=\"" + preStyle + commentStyle + "\">")//.comment - Applied to comment lines
    //.comment-italic - Applied to italic comment lines
    //.comment-box - Applied to boxed comment lines
    //.highlight - Applied to highlighted text
    //.section - Applied to all section containers
    //.section-label - Applied to section labels
    //.chorus - Applied to chorus containers
    //.verse - Applied to verse containers
    //.bridge - Applied to bridge sections
    //.tab - Applied to tab sections
    //.grid - Applied to grid sections
    //.abc - Applied to ABC notation sections
    //.ly - Applied to LilyPond notation sections
    //.svg - Applied to SVG content sections
    //.textblock - Applied to text block sections
    //.chorus-ref - Applied to chorus references
    //.chord-diagram - Applied to chord diagrams
    //.chord-name - Applied to chord names in diagrams
    //.chord-definition - Applied to chord definitions in diagrams
    //.page-break - Applied to page breaks
    //.physical-page-break - Applied to physical page breaks
    //.column-break - Applied to column breaks
    //.image - Applied to image containers
    .replaceAll("<div class=\"empty-line\">", "<div class=\"empty-line\" style=\"" + emptyLineStyle + "\">")
    //.artist - Applied to artist information
    //.key - Applied to key information
    //.replaceAll("</pre>", "</pre>\n")
    
}

async function detectAndRender(settings, reason: string) {
  log("Detect triggered:", reason);
  //const editing = logseq.Editor.checkEditing();
  //const isEditing = await logseq.App.getStateFromStore('editor/in-composition?');
  //log("isEditing:", isEditing )
  //if ( editing ){
    //log("User is editing, wait");
    //return;
  // } else {
    const page = await logseq.Editor.getCurrentPage();
    if (!page || typeof page.uuid !== "string") return;

    const blocks = await logseq.Editor.getPageBlocksTree(page.uuid);
    if (!blocks) return;
  //}
  // recursively find first block containing "[chordpro]]" or "{title:"
  // To allocate chordpro conten
  function find(nodes: any[]): any | null {
    for (const b of nodes) {
      if (
        typeof b.content === "string" &&
        b.content.toLowerCase().includes("[[chordpro]]") ||
        b.content.toLowerCase().includes("{title:") ||
        b.content.toLowerCase().includes("\`\`\`chords") 
      ) {
        return b;
      }
      if (b.children?.length) {
        const found = find(b.children);
        if (found) return found;
      }
    }
    return null;
  }

  function finDMeta(nodes: any[]): any | null {
    for (const b of nodes) {
      if (
        typeof b.content === "string" &&
        b.content.toLowerCase().includes("page-type:: chordpro") &&
        b.content.toLowerCase().includes("song-title")
      ) {
        return b;
      }
    }
    return null;
  }

  function findPlayed(nodes: any[]): any | null {
    for (const b of nodes) {
      if (
        typeof b.content === "string" &&
        b.content.toLowerCase().includes("played")) {
          log ("play counter found")
        return b;
      }
      if (b.children?.length) {
        const found = findPlayed(b.children);
        if (found) return found;
      }
    }
    return null;
  }

   function findDate(formattedDate, nodes: any[]): any | null {
    log ("datestring: " + formattedDate);
    for (const b of nodes) {
      //log("block content:" + b.content + " :: " + formattedDate)
      if (
        typeof b.content === "string" &&
        b.content.toLowerCase().includes(formattedDate.toLowerCase())) {
          log ("todays dateblock found")
        return b;
      }
      if (b.children?.length) {
        const found = findDate(formattedDate, b.children);
        if (found) return found;
      }
    }
    return null;
  }
  
  let playCounterBlock;
  let newCounterBlock;
  let targetBlock;
  const meta = finDMeta(blocks);
  try {
  if (settings.playcounter) {
    log ("playcounter enabled", meta.uuid);
    // check if played block is missing
    playCounterBlock = findPlayed(blocks);
    //log("Played block = ", playCounterBlock.uuid); 
    // if missing create played block as a child to meta block 
    if (!playCounterBlock || typeof playCounterBlock.uuid !== "string") {
      log ("No playcounter block found - inserting");
      newCounterBlock = await logseq.Editor.insertBlock(
        meta.uuid,
        "### Played",
        { sibling: false }   
      );
      
      //log("NOw PlayCounter block is: " + playCounterBlock.uuid);

    } 
  }
    
    // add todays date - format do MMM yyyy -as child of played block
    //const todaysDate = moment().format('do MMM yyyy');
    const date = new Date();
    const formattedDate = format(date, 'do MMM yyyy');
    const dateBlock = findDate(formattedDate, blocks)
    if (!dateBlock || typeof dateBlock.uuid !== "string") {
      log ('no dateblodck found -inserting')
      if (!playCounterBlock){ 
        targetBlock = newCounterBlock;
        log ("using new counterblock")
      } else {
        targetBlock = playCounterBlock;
        log ("using existing counterblock")
      }

      await logseq.Editor.insertBlock(
        targetBlock.uuid,
        "[[" + formattedDate + "]]",
        { sibling: false }   
      );
    }
  }  catch (err) {
    console.error("🎵 [ChordPro] Render error", err, { source });
    return;
  }
  const block = find(blocks);
  if (!block || typeof block.uuid !== "string") return;

 
  const source = block.content
  const chordpro = ChordproJS();
  //const contentHash = hash(source); 
  
  // skip if content unchanged
  //if (seenHashes.get(block.uuid) === contentHash) return;
  //seenHashes.set(block.uuid, contentHash);

  log("FOUND chordpro block:", block.uuid);

  let html; 
  let HTMLBlockUUID ="";
  let HTMLBlockContent="";

  try {
    // add a newline at the end to avoid JS-ChordPro parse errors
    const doc = sanitizeChordPro(source);
    //g("Sanitized source:\n", doc);
    //const style = "<head><style>.chord-line { color: #0066cc; font-weight: bold; } .title {color: #e06c75;  /* Pink for title */}</style></head>";
    html = makeShiny(chordpro.renderToHTML(doc));
    //html = makeShiny(chordpro.renderToHTML(source));
    // After rendering

  } catch (err) {
    console.error("🎵 [ChordPro] Render error", err, { source });
    return;
  }

	// remove previously rendered HTML children
	try {
      const children = await logseq.Editor.getCurrentPageBlocksTree();
  		for (const child of children ?? []) {
        //log("FOUND child", child.content);
    		//if (typeof child.content === "string" && child.content.includes("[[chordpro]]")) {
          //logseq.Editor.setBlockCollapsed(child.uuid, true);
          const sibling = await logseq.Editor.getNextSiblingBlock(block.uuid); 
          //log(" '----> sibling content", sibling?.content)
          if ( typeof sibling?.content === "string" && sibling.content.includes("<h1>")) { 
          log("FOUND sibling with HTML", sibling.uuid);
          //log("sibling content", sibling.content)
          HTMLBlockUUID = sibling.uuid
          HTMLBlockContent = sibling.content
          //await logseq.Editor.removeBlock(sibling.uuid);
          } else {
            HTMLBlockUUID = "";
            HTMLBlockContent = "";
          }
      
  		}
	} catch (err) {
  			console.warn("🎵 [ChordPro] Could not fetch children", err);
	}



  // insert rendered HTML
  if (HTMLBlockContent === html) {
    log ("HTML Block is the same - no render");
    return
  } else {
      log ("HTML changed");
      if (HTMLBlockUUID !== "") {
        log ("removing old HTML block", HTMLBlockUUID);
        await logseq.Editor.removeBlock(HTMLBlockUUID);
      }
      log ("Inserting new HTML block");
      await logseq.Editor.insertBlock(
      block.uuid,
      //`\`\`\`html\n${html}\n\`\`\``,
      `${html}`,
      { sibling: true }   
      );
  }
  
 

 /* If we need to reinsert the chordpro content 

    await logseq.Editor.insertBlock(
    block.uuid,
    //`\`\`\`html\n${html}\n\`\`\``,
    `${source}\n`,
    { sibling: true }
     
  );*/

  log("Rendered successfully");
  
}

function startPolling(settings) {
  if (pollTimer) return;
  pollTimer = window.setInterval(() => {
    detectAndRender(settings, "poll");
  }, 1500);
}

async function main(baseInfo: LSPluginBaseInfo) {
  console.log("🎵 ChordPro renderer plugin loaded");
  const { settings } = baseInfo

  setTimeout(() => detectAndRender(settings, "startup"), 800);

  logseq.App.onRouteChanged(() => {
    seenHashes.clear();
    detectAndRender(settings, "route-change");
  });

  //logseq.App.onBlockRendererSlotted()
  //startPolling(settings);
}
logseq.useSettingsSchema(settingsSchema)
logseq.ready(main).catch(console.error);
