"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import Cookies from "js-cookie";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string>("zone1");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const username = Cookies.get("username");
  const [inputUsername, setInputUsername] = useState("");
  const [message, setMessage] = useState("");
  const [discussion, setDiscussion] = useState<
    { username: string; message: string }[]
  >([]);

  useEffect(() => {
    let ws: WebSocket | null = null;

    function init() {
      if (ws) {
        ws.onerror = ws.onopen = ws.onclose = ws.onmessage = null;
        ws.close();
      }

      ws = new WebSocket(process.env.WS_SERVER ?? "ws://localhost:6969");
      ws.onopen = () => {
        console.log("Connection opened!");
        ws?.send(JSON.stringify({ zone: selectedZone, message: "" }));
      };

      ws.onmessage = (data) => {
        console.log("Message received!");
        const parsedData = JSON.parse(data.data);
        const { message, username } = parsedData;

        if (message && username) {
          setDiscussion((prev) => [
            ...prev,
            { username: parsedData.username, message: parsedData.message },
          ]);
        }
      };

      ws.onclose = function () {
        ws = null;
      };
      setWs(ws);
    }
    init();
  }, []);

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUsername.trim()) {
      Cookies.set("username", inputUsername.trim());
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <div className="w-80 h-96 bg-white rounded-xl shadow-lg flex flex-col border border-gray-200">
          <div className="flex justify-between items-center p-4 border-b">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-800">Chat with us</span>
              <select
                onChange={(e) =>
                  setSelectedZone(() => {
                    setDiscussion([]);
                    if (ws) {
                      ws.send(
                        JSON.stringify({
                          zone: e.target.value,
                          message: "",
                        }),
                      );
                    }
                    return e.target.value;
                  })
                }
                className="text-sm border rounded px-2 py-1 text-gray-700"
              >
                <option value="zone1">Zone 2</option>
                <option value="zone2">Zone 3</option>
                <option value="zone3">Zone 4</option>
              </select>
            </div>
            <button onClick={() => setOpen(false)}>
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          {username ? (
            <>
              {/* Zone de discussion */}
              <div className="flex-1 p-4 overflow-y-auto text-sm text-gray-700">
                {discussion.length > 0 ? (
                  discussion.map((v, i) => {
                    return (
                      <div key={`${v.username}-${i}`} className="mb-2">
                        <span className="font-semibold">{v.username}: </span>
                        {v.message}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500">
                    Pas de nouveau message pour le moment.
                  </p>
                )}
              </div>
              <div className="p-4 border-t">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (ws) {
                      ws.send(
                        JSON.stringify({
                          zone: selectedZone,
                          message: message,
                          username: username,
                        }),
                      );
                      setMessage("");
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder="Votre message..."
                    className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring"
                    onChange={(e) => setMessage(e.target.value)}
                    value={message}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Envoyer
                  </button>
                </form>
              </div>
            </>
          ) : (
            <form
              onSubmit={handleUsernameSubmit}
              className="p-4 flex flex-col gap-2 flex-1 justify-center"
            >
              <label className="text-sm text-gray-700">
                Entrez votre nom :
              </label>
              <input
                type="text"
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                className="px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring"
                placeholder="Nom d'utilisateur"
              />
              <button
                type="submit"
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Continuer
              </button>
            </form>
          )}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
