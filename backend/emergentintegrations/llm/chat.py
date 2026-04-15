class UserMessage:
    def __init__(self, text: str):
        self.text = text


class LlmChat:
    def __init__(self, api_key: str = "", session_id: str = "", system_message: str = ""):
        self.api_key = api_key
        self.session_id = session_id
        self.system_message = system_message
        self._model_provider = None
        self._model_name = None

    def with_model(self, provider: str, model: str):
        self._model_provider = provider
        self._model_name = model
        return self

    async def send_message(self, message: UserMessage) -> str:
        raise RuntimeError(
            "LLM integration unavailable: emergentintegrations package not installed. "
            "Daily briefing AI feature requires a valid API key and the emergentintegrations package."
        )
