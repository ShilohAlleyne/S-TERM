import types/data
import types/model.{type Model}
import types/text

pub type Msg {
    FetchedCommands(data: data.CommandData)
    FetchedCommandsFailed
    KeyPress(String)
    UpdateInput(String)
    InvalidCommand(String)
    // Printing
    PrettyPrint(char: String, str: String)
    InitPrettyPrint(char: String, txt: text.Text, model: Model)
    ChainPrint
    // Status
    PrettyPrintStatus(char: String, str: String)
    InitPrettyPrintStatus(char: String, txt: text.Text, model: Model)
    RelayStatus
    FetchedData(data: data.JsonData)
    FetchFailed
    Reset
    DownloadPDF
}
