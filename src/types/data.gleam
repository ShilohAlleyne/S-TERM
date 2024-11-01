pub type Command {
	Command(
		command: String,
		api: String,
		help_desc: String,
		flags: List(Flag)
	)
}

pub type Flag {
	Flag(
		flag: String,
		header: String,
		help_desc: String
	)
}

pub fn new_flag() -> Flag {
    Flag("", "", "")
}

pub type CommandData {
    CommandData(
        commands: List(Command),
        metadata: Metadata
    )
}

pub fn new_command_data() -> CommandData {
    CommandData([], Metadata("", False, "", "", ""))
}

pub type Record {
    Record(
        title: String, 
        desc: String
    )
}

pub type Metadata {
    Metadata(
        id: String,
        private: Bool,
        created_at: String,
        collection_id: String,
        name: String
    )
}

pub type JsonData {
    JsonData(
        records: List(Record),
        metadata: Metadata
    )
}
