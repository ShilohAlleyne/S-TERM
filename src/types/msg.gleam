import types/data
import types/text
import types/model.{type Model}

pub type Msg {
    FetchedCommands(data: data.CommandData)
    FetchedCommandsFailed
    KeyPress(String)
    UpdateInput(String)
    InvalidCommand(String)
    PrettyPrint(char: String, str: String)
    InitPrettyPrint(char: String, txt: text.Text, model: Model)
    ChainPrint
    FetchedData(data: data.JsonData)
    FetchFailed
    Reset
    DownloadPDF
}
