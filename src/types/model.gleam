import types/data
import types/text
import output/text_styling as ts

pub type Model {
    Model(
        state: State,
        status: List(text.Text),
        status_q: List(text.Text),
        valid_commands: data.CommandData,
        input: String,
        output: List(text.Text),
        output_q: List(text.Text),
        command_history: List(#(Int, String)),
        flag: data.Flag,
        pos: Int,
        current_pos: Int
    )
}

pub type State {
    Loading
    GO
    LoadingFailed
    InputsLocked
}

pub fn init() -> Model {
    Model(
        state: Loading,
        status: [],
        status_q: [],
        valid_commands: data.new_command_data(),
        input: "",
        output: [],
        output_q: [],
        command_history: [],
        flag: data.new_flag(),
        pos: 0,
        current_pos: 0
    )
}

// Loads the valid commands for the model
pub fn startup(data: data.CommandData) -> Model {
    let text = [
        text.Text(ts.buffer(" ", " ", 10), "", text.Span),
        text.Text(ts.buffer("[", "-", 52), "text-green-300", text.Span),
        text.Text("[", "text-green-400", text.Span),
        text.Text("ALL SYSTEMS GO", "text-green-500", text.Span),
        text.Text("]", "text-green-400", text.Span),
        text.Text("]", "text-green-300", text.Span),
        text.Text(ts.buffer("-", "-", 52), "text-green-300", text.Span),

    ]
    Model(..init(), state: GO, valid_commands: data, status_q: text)
}

pub fn error(error: String, model: Model) -> Model {
    Model(..model, output_q: [text.Text(error, "text-yellow-500", text.Span)])
}

pub fn serious_error(error: String, model: Model) -> Model {
    Model(..model, output_q: [text.Text(error, "text-red-500", text.Span)])
}
