// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { table } from "console";
import * as vscode from "vscode";

let timers: { [document_uri: string]: NodeJS.Timeout } = {};


function nowSeconds(): number {
  return (Date.now() / 1000) | 0;
}


function closeTab(tab: vscode.Tab): void {
  console.log("Close document: " + tab.resource?.fsPath);
  tab.close();
}


// function closeDocument(document: vscode.TextDocument): void {
//   console.log("Close document: " + document.uri.fsPath);

//   if (document.isClosed) {
//     return;
//   }

//   vscode.window
//     .showTextDocument(document.uri, { preview: true, preserveFocus: false })
//     .then(() => {
//       return vscode.commands.executeCommand(
//         "workbench.action.closeActiveEditor"
//       );
//     });
// }

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "autoclose" is now active!');
  console.log("vscode.window.tabs: " + vscode.window.tabs.length);
  vscode.window.showInformationMessage("keys in workspaceState: " + context.workspaceState.keys());
  // console.log("keys in workspaceState: " + context.workspaceState.keys());

  console.log(context.extensionUri);

  vscode.window.tabs.forEach((item) => {
    let key = item.resource?.fsPath;
    console.log("open Tab: ", key);
    if (key && key in context.workspaceState) {
      let lastModified = context.workspaceState.get(key) as number;
      let remainingSec = nowSeconds() - lastModified;
      console.log("\t remainingSec: ", remainingSec);

      if(remainingSec <= 0)
      {
        item.close();
      }else{
        // set timer to remaining seconds
        timers[key] = setTimeout(
          closeTab,
          remainingSec * 1000,
          item
        );
      }
    }
  });

  // context.subscriptions.push(
  //   vscode.window.onDidChangeActiveTextEditor((editor) => {
  //     console.log("onDidChangeActiveTextEditor" + editor?.document.uri.fsPath);

  //     if (editor) {
  //       resetTimer(context, editor.document);
  //     }
  //   })
  // );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTab((tab) => {
      console.log("onDidChangeActiveTab" + tab?.resource?.fsPath);

      if (tab) {
        resetTimer(context, tab);
      }
    })
  );
}


function resetTimer(
  context: vscode.ExtensionContext,
  tab: vscode.Tab
): void {
  let key = tab.resource?.fsPath;
  console.log("Resetting timer for " + key);

  if (key) {
    console.log("Updating workspaceState for: ", key);
    // set state to last touched
    context.workspaceState.update(
      key,
      nowSeconds
    );

    // if there is still a timer runing, clear it
    if (key in timers) {
      console.log("clearing timer for " + key);
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
  console.log("keys: " + context.workspaceState.keys());
}

// this method is called when your extension is deactivated
export function deactivate() {}
