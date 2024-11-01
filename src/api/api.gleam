import gleam/fetch
import gleam/http/request
import gleam/javascript/promise

import decode

import types/data
import types/msg

pub fn fetch_json(api: String, dispatch) {
    // set up the request
    let assert Ok(req) = request.to(api)
    let reqq = request.set_header(
        req,
        "X-Master-Key",
        "$2a$10$5YHLC4UsaDMiVzLdw03mfOGQiOaAiecd.zRWBH4Gqkc8X9vwR0zt."
    )

    // Send the HTTP request to the server
    {
        use resp <- promise.try_await(fetch.send(reqq))
        use resp <- promise.try_await(fetch.read_json_body(resp))

        // Check if the response is OK
        case resp.status {
            200 -> {
                    // Decode json
                let proficiency_decoder = decode.into({
                    use title <- decode.parameter
                    use desc  <- decode.parameter
                    data.Record(title: title, desc: desc)
                })
                |> decode.field("title", decode.string)
                |> decode.field("desc", decode.string)

                let metadata_decoder = decode.into({
                    use id            <- decode.parameter
                    use private       <- decode.parameter
                    use created_at    <- decode.parameter
                    use collection_id <- decode.parameter
                    use name          <- decode.parameter
                    data.Metadata(
                        id: id, 
                        private: private, 
                        created_at: created_at, 
                        collection_id: collection_id, 
                        name: name
                    )
                })
                |> decode.field("id", decode.string)
                |> decode.field("private", decode.bool)
                |> decode.field("createdAt", decode.string)
                |> decode.field("collectionId", decode.string)
                |> decode.field("name", decode.string)

                let data_decoder = decode.into({
                    use record   <- decode.parameter
                    use metadata <- decode.parameter
                    data.JsonData(records: record, metadata: metadata)
                })
                |> decode.field("record", decode.list(proficiency_decoder))
                |> decode.field("metadata", metadata_decoder)
                |> decode.from(resp.body)
                
                // Send the message if decoded correctly
                case data_decoder {
                    Ok(data) -> dispatch(msg.FetchedData(data))
                    Error(_) -> dispatch(msg.FetchFailed)
                }
            }
            _   -> dispatch(msg.FetchFailed)
        }
        // Resolve the promise
        promise.resolve(Ok(Nil))
    }
    Nil
}

// Get valid commands
pub fn get_commands(dispatch) {
    // set up the request
    let assert Ok(req) = request.to("https://api.jsonbin.io/v3/b/670da6a9acd3cb34a89703a7")
    let reqq = request.set_header(
        req,
        "X-Master-Key",
        "$2a$10$5YHLC4UsaDMiVzLdw03mfOGQiOaAiecd.zRWBH4Gqkc8X9vwR0zt."
    )

    // Send the HTTP request to the server
    {
        use resp <- promise.try_await(fetch.send(reqq))
        use resp <- promise.try_await(fetch.read_json_body(resp))

        // Check if the response is OK
        case resp.status {
            200 -> {
                let flag_decoder = decode.into({
                    use flag      <- decode.parameter
                    use header    <- decode.parameter
                    use help_desc <- decode.parameter
                    data.Flag(flag: flag, header:header, help_desc: help_desc)
                })
                |> decode.field("flag", decode.string)
                |> decode.field("header", decode.string)
                |> decode.field("help_desc", decode.string)

                let command_decoder = decode.into({
                    use command   <- decode.parameter
                    use api       <- decode.parameter
                    use help_desc <- decode.parameter
                    use flags     <- decode.parameter
                    data.Command(
                       command: command,
                       api: api,
                       help_desc: help_desc,
                       flags: flags,
                    )
                })
                |> decode.field("command", decode.string)
                |> decode.field("api", decode.string)
                |> decode.field("help_desc", decode.string)
                |> decode.field("flags", decode.list(flag_decoder))

                let metadata_decoder = decode.into({
                    use id            <- decode.parameter
                    use private       <- decode.parameter
                    use created_at    <- decode.parameter
                    use collection_id <- decode.parameter
                    use name          <- decode.parameter
                    data.Metadata(
                        id: id, 
                        private: private, 
                        created_at: created_at, 
                        collection_id: collection_id, 
                        name: name
                    )
                })
                |> decode.field("id", decode.string)
                |> decode.field("private", decode.bool)
                |> decode.field("createdAt", decode.string)
                |> decode.field("collectionId", decode.string)
                |> decode.field("name", decode.string)

                let data_decoder = decode.into({
                    use commands  <- decode.parameter
                    use metadata  <- decode.parameter
                    data.CommandData(commands: commands, metadata: metadata)
                })
                |> decode.field("record", decode.list(command_decoder))
                |> decode.field("metadata", metadata_decoder)
                |> decode.from(resp.body)

                case data_decoder {
                    Ok(data) -> dispatch(msg.FetchedCommands(data))
                    Error(_) -> dispatch(msg.FetchFailed)
                }
            }
            _   -> dispatch(msg.FetchFailed)
        }
        // Resolve the promise
        promise.resolve(Ok(Nil))
    }
    Nil
}
