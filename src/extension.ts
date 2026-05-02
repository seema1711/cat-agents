import * as vscode from 'vscode';
import { COMMAND_EXPORT_DEFAULT_LAYOUT, COMMAND_SHOW_PANEL, VIEW_ID } from './constants';
import { CatAgentsViewProvider } from './CatAgentsViewProvider';

let provider: CatAgentsViewProvider | undefined;

export function activate(context: vscode.ExtensionContext) {
  provider = new CatAgentsViewProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(VIEW_ID, provider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
    vscode.commands.registerCommand(COMMAND_SHOW_PANEL, () => {
      vscode.commands.executeCommand('workbench.view.extension.cat-agents');
    }),
    vscode.commands.registerCommand(COMMAND_EXPORT_DEFAULT_LAYOUT, () => {
      provider?.exportDefaultLayout();
    }),
  );
}

export function deactivate() {
  provider?.dispose();
}
