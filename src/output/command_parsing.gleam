import gleam/string as s
import gleam/list as l
import gleam/int as i

import lustre/effect

import api/api
import types/text
import types/model.{type Model}
import types/model as mdl
import types/msg.{type Msg}
import types/data.{type Command}
import output/text_rendering as rend

// Handles keyboard input
pub fn parse_keypress(key: String, model: Model) -> #(Model, effect.Effect(Msg)) {
    case key {
        // Run command function on Enter (for now we just print the input)
        "Enter" -> {
            let inc = model.pos + 1
            let new_model = mdl.Model(
                ..model, 
                command_history: l.append(model.command_history, [#(inc, model.input)]),
                pos: inc,
                current_pos: inc + 1
            )
            parse_input(new_model)
        }
        // Get prev command
        "ArrowUp" -> {
            let inc_current = model.current_pos - 1
            let command = l.key_find(model.command_history, inc_current)
            case command {
                Ok(c)    -> #(mdl.Model(..model, input: c, current_pos: inc_current), effect.none())
                Error(_) -> #(model, effect.none())
            }
        }
        "ArrowDown" -> {
            case model.current_pos > model.pos {
                True  -> #(model, effect.none())
                False -> {
                    let inc = model.current_pos + 1
                    let command = l.key_find(model.command_history, inc)
                    case command {
                        Ok(c)    -> #(mdl.Model(..model, input: c, current_pos: inc), effect.none())
                        Error(_) -> #(model, effect.none())
                    }
                }
            }
        }
        _ -> #(model, effect.none())
    }
}

// Needs some work
pub fn parse_input(model: Model) -> #(Model, effect.Effect(Msg)) {
    let runner = create_runner(model.input)
    let new_model = mdl.Model(..model, input: "", output: l.append(model.output, runner))
    let args: List(String) = s.split(model.input, on: " ")

    // lock the user from inputs if the model is still loading
    case model.state {
        mdl.Loading -> #(model, effect.none())
        mdl.LoadingFailed -> #(model, effect.none())
        mdl.GO -> parse_args(args, new_model)
    }
}

fn create_runner(input: String) -> List(text.Text) {
    [
        text.Text(text: "\n\n[", style: "py-2 font-bold Consolas text-purple-300", html: text.Span),
        text.Text(text: "runner", style: "py-2 Consolas text-purple-400", html: text.Span),
        text.Text(text: "] [", style: "py-2 font-bold Consolas text-purple-300", html: text.Span),
        text.Text(text: "🖿 ~/shiloh-alleyne/cv", style: "py-2 Consolas text-purple-400", html: text.Span),
        text.Text(text: "] [", style: "py-2 font-bold Consolas text-purple-300", html: text.Span),
        text.Text(text: "🗲main", style: "py-2 Consolas text-purple-400", html: text.Span),
        text.Text(text: "] ", style: "py-2 font-bold Consolas text-purple-300", html: text.Span),
        text.Text(text: "❱", style: "py-2 font-bold Consolas text-purple-400", html: text.Span),
        text.Text(text: "❱ ", style: "py-2 font-bold Consolas text-purple-300", html: text.Span),
        text.Text(text: input <> "\n\n", style: "", html: text.Span)
    ]
}

fn parse_args(args: List(String), new_model: Model) -> #(Model, effect.Effect(Msg)) {
    case args {
        ["clear", ..]    -> #(new_model, effect.from(fn(dispatch) { dispatch(msg.Reset) }))
        ["print", ..str] -> #(new_model, effect.from(fn(dispatch) { dispatch(msg.InitPrettyPrint("", text.Text(s.join(str, " "), "", text.Span), new_model)) }))
        ["help", flag]   -> render_command_help(new_model, flag)
        ["help"]         -> rend.render_text(parse_help(new_model))
        ["cv"]           -> #(new_model, effect.from(fn(dispatch) { dispatch(msg.DownloadPDF)}))
        [command, flag]  -> execute_command_with_flag(new_model, command, flag)
        [command]        -> execute_command(new_model, command)
        _                -> #(new_model, effect.from(fn(dispatch) { dispatch(msg.InvalidCommand(new_model.input)) }))
    }
}

fn render_command_help(new_model: Model, flag: String) -> #(Model, effect.Effect(Msg)) {
    let command = s.drop_left(flag, 2)
    // Validate if the command actually exists
    case l.find_map(new_model.valid_commands.commands, parse_command(command, _)) {
        Ok(c)        -> rend.render_text(mdl.Model(..new_model, output_q: gen_command_help(c)))
        _bad_command -> {
            let error_msg = [
                text.Text("The command: ", "text-yellow-500", html: text.Span),
                text.Text(command, "text-yellow-300", html: text.Span),
                text.Text(" does not exist, therefore you cannot call help for it.", "text-yellow-500", html: text.Span),
                text.Text("\n\nType help for a list of valid commands.", "text-yellow-500", html: text.Span)
            ]
            rend.render_text(mdl.Model(..new_model, output_q: error_msg))
        }
    }
}

fn execute_command_with_flag( new_model: Model, input: String, flag: String) -> #(Model, effect.Effect(Msg)) {
    // Validate if the command actually exists
    case l.find_map(new_model.valid_commands.commands, parse_command(input, _)) {
        Ok(c) -> {
            // Now actually send command
            case parse_flag(flag, c) {
                Ok(f)            -> #(mdl.Model(..new_model, flag: f), effect.from(api.fetch_json(c.api, _)))
                Error(_bad_flag) -> render_flag_error(new_model, c, flag)
            }
        }
        Error(_bad_command) -> render_invalid_command(new_model, input)
    }
}

fn execute_command(new_model: Model, command: String) -> #(Model, effect.Effect(Msg)) {
    // Validate if the command actually exists
    case l.find_map(new_model.valid_commands.commands, parse_command(command, _)) {
        // We now need to check if the command is one without flags
        Ok(c) -> case l.is_empty(c.flags) {
            True -> #(mdl.Model(..new_model, flag: data.Flag("--all", "", "")), effect.from(api.fetch_json(c.api, _)))
            False -> render_flag_error(new_model, c, "")
        }
        Error(_) -> render_invalid_command(new_model, command)
    }
}

fn render_flag_error(new_model: Model, command: Command, flag: String) -> #(Model, effect.Effect(Msg)) {
    case flag {
        // All commands that have flags have an all flag, which is not included in their respective JSON
        "--all"   -> #(mdl.Model(..new_model, flag: data.Flag("--all", "", "")), effect.from(api.fetch_json(command.api, _)))
        ""        -> {
            let error_msg = [
                text.Text("The command: ", "text-yellow-400", html: text.Span),
                text.Text(command.command, "text-yellow-300", html: text.Span),
                text.Text(" requires a flag.\n\n", "text-yellow-400", html: text.Span),
                text.Text("Run the command: ", "", html: text.Span),
                text.Text("help --" <> command.command, "text-purple-400", html: text.Span),
                text.Text(" for infomation about the " <> command.command <> " command.", "", html: text.Span)
            ]
            rend.render_text(mdl.Model(..new_model, output_q: error_msg))            
        }
        _bad_flag -> {
            let error_msg = [
                text.Text("The command: ", "text-yellow-400", html: text.Span),
                text.Text(command.command, "text-yellow-300", html: text.Span),
                text.Text(", does not have the flag: ", "text-yellow-400", html: text.Span),
                text.Text(flag, "text-yellow-300", html: text.Span),
                text.Text(".\n\n", "text-yellow-400", html: text.Span),
                text.Text("Run the command: ", "", html: text.Span),
                text.Text("help --" <> command.command, "text-purple-400", html: text.Span),
                text.Text(" for infomation about the " <> command.command <> " command.", "", html: text.Span)
            ]
            rend.render_text(mdl.Model(..new_model, output_q: error_msg))
        }
    }
}

fn render_invalid_command(new_model: Model, command: String) -> #(Model, effect.Effect(Msg)) {
    let error_msg = [
        text.Text("Invalid Command: ", "text-yellow-500", html: text.Span),
        text.Text(command, "text-yellow-400", html: text.Span)
    ]
    rend.render_text(mdl.Model(..new_model, output_q: error_msg))
}

fn parse_command(input: String, command: Command) -> Result(Command, Nil) {
    case input == command.command {
        True -> Ok(command)
        False -> Error(Nil)
    }
}

// Checks if the input flag corresponds to the parsed command
fn parse_flag(flag: String, command: Command) -> Result(data.Flag, Nil) {
    case l.find_map(
        command.flags,
        fn(input) {
            case input.flag == flag {
                True -> Ok(input)
                False -> Error(Nil)
            }
        }
    ) {
        Ok(f) -> Ok(f)
        Error(Nil) -> Error(Nil)
    }
}

// Returns a model with the help output quequed up
fn parse_help(model: Model) -> Model {
    let new_model = mdl.Model(..model, flag: data.Flag("", "", ""))

    let max = {
        let lengths = l.map(model.valid_commands.commands, fn(c){s.length(c.command)})
        l.fold(lengths, 0, i.max)
    }

    let basic_help = {
        let example = case l.filter(model.valid_commands.commands, fn(command: Command) {l.length(command.flags) >= 2}) {
            [first, .._rest] -> first.command
            _                -> "exampleCommand"
        }
        let help = l.map(model.valid_commands.commands, gen_help(_, max)) 
        |> l.intersperse([text.Text("\n", "", html: text.Span)])
        |> l.flatten
        let appendix = [
            text.Text("\n\nYou can also supply a command as flag for ", "", html: text.Span),
            text.Text("help", "text-purple-300", html: text.Span),
            text.Text(" to get more information about that specific command e.g.\n\n", "", html: text.Span),
            text.Text("help ", "", html: text.Span),
            text.Text("--" <> example, "text-purple-300", html: text.Span)
        ]
        l.append(help, appendix)
    }
    mdl.Model(..new_model, output_q: basic_help)    
}

// styles each line of the basic help 
fn gen_help(command: Command, max: Int) -> List(text.Text) {
    let buffer = s.concat(l.repeat(" ", {max + 2} - s.length(command.command)))
    [
        text.Text(text: "[", style: "py-2 font-bold Consolas text-purple-300", html: text.Span),
        text.Text(text: command.command, style: "py-2 Consolas text-purple-400", html: text.Span),
        text.Text(text: "]" <> buffer, style: "py-2 font-bold Consolas text-purple-300", html: text.Span),
        text.Text(text: command.help_desc, style: "", html: text.Span) 
    ]
}

// generates the basic help output based opn the current valid commands
fn gen_command_help(command: Command) -> List(text.Text) {
    case command.flags {
        [] -> [
            text.Text("The command: ", "", html: text.Span),
            text.Text(command.command, "text-purple-300", html: text.Span),
            text.Text(" takes no additonal flags.", "", html: text.Span)
        ]
        _  -> {
            let max = {
                let lengths = l.map(command.flags, fn(flag){s.length(flag.flag)})
                l.fold(lengths, 0, i.max)
            }
            let flags = {
                l.map(
                    command.flags, 
                    fn(flag) {
                        let buffer = s.concat(l.repeat(" ", {max + 2} - s.length(flag.flag)))
                        [text.Text(flag.flag <> buffer, "text-purple-300", html: text.Span), text.Text(flag.help_desc, "", html: text.Span)]
                    }
                )
                |> l.intersperse([text.Text("\n", "", html: text.Span)])
                |> l.flatten
                |> l.append([text.Text("\n--all" <> s.concat(l.repeat(" ", {max + 2} - 5)), "text-purple-300", html: text.Span), text.Text("everything at once", "", html: text.Span)])
            }
            let help = [
                text.Text("help: " <> command.command <> "\n\n", "", html: text.Span),
                text.Text("Pass in any of these flags with the ", "", html: text.Span),
                text.Text(command.command, "text-purple-300", html: text.Span),
                text.Text(" command to find out more infomation\n\n", "", html: text.Span)
            ]
            l.append(help, flags)
        }
    }
}
