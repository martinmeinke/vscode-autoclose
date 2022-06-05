import * as vscode from "vscode";
import { TabInputText } from 'vscode';
let timers: { [document_uri: string]: NodeJS.Timeout } = {};

function nowSeconds(): number {
  return (Date.now() / 1000) | 0;
}

function closeTab(tab: vscode.Tab): void {

  const closeDirty = vscode.workspace
    .getConfiguration()
    .get("autoclose.closeDirtyEditor");

  if(tab.isDirty && !closeDirty)
  {
    return;
  }

  vscode.window.tabGroups.close(tab).then(success => {
    if (success) {
      console.log(`successfully closed tab ${tab.label}`);
    } else {
      console.error(`issue closing tab ${tab.label}`);
    }
  });
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('context.extensionUri: ' + context.extensionUri);
  for (const tab of vscode.window.tabGroups.all.map(g => g.tabs).flat()) {

    // only close text input tabs
    if (!(tab.input instanceof TabInputText)) {
      continue;
    }

    let key = tab.input.uri.toString();
    console.log(`open Tab: ${key}`);
    if (key && context.workspaceState.keys().includes(key)) {
      let lastModified = context.workspaceState.get(key) as number;
      let remainingSec = nowSeconds() - lastModified;
      console.log(`\t remainingSec: ${remainingSec}`);

      if (remainingSec <= 0) {
        closeTab(tab);
      } else {
        // set timer to remaining seconds
        timers[key] = setTimeout(
          closeTab,
          remainingSec * 1000,
          tab
        );
      }
    }
  }

  context.subscriptions.push(
    vscode.window.tabGroups.onDidChangeTabs(async tabs => {
      for (const tab of tabs.changed.filter(tab => tab.input instanceof TabInputText)) {
        resetTimer(context, tab);
      }
    })
  )
}


function resetTimer(
  context: vscode.ExtensionContext,
  tab: vscode.Tab
): void {
  let key = (tab.input as TabInputText).uri.toString();
  if (key) {
    // set state to last touched
    context.workspaceState.update(
      key,
      nowSeconds()
    ).then(() => console.log('workspaceState updated'), () => console.error('error updating workspaceState'));

    // if there is still a timer runing, clear it
    if (key in timers) {
      console.log(`clearing timer for ${key}`);
      clearTimeout(timers[key]);
    }

    // set new timer to the configured number of seconds from now
    const configTimeout = vscode.workspace
      .getConfiguration()
      .get("autoclose.ageInSeconds");

    timers[key] = setTimeout(
      closeTab,
      (configTimeout as number) * 1000,
      tab
    );
  }
}

// this method is called when your extension is deactivated
export function deactivate() { }
