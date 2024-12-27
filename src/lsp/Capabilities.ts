import { ClientCapabilities } from "vscode-languageserver";

export const MyCapabilities: ClientCapabilities = {
    /**
     * Workspace specific client capabilities.
     */
    textDocument: {
        references: {
            dynamicRegistration: true
        },
        


    },
    workspace:{
        symbol:{
           
        }
    },
    window:
    {
        workDoneProgress: false,
        showDocument: {
            support: true
        },
        showMessage: {
            messageActionItem: { additionalPropertiesSupport: false }

        },

    }
}