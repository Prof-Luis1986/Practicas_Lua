const editor = document.getElementById("lua-editor");
const output = document.getElementById("output");
const runBtn = document.getElementById("run-btn");
const clearBtn = document.getElementById("clear-btn");

function setOutput(text) {
  output.textContent = text;
}

function ensureFengariLoaded() {
  if (!window.fengari) {
    throw new Error(
      "No se pudo cargar el motor Lua. Verifica tu conexión a internet e intenta de nuevo.",
    );
  }
}

function executeLua() {
  try {
    ensureFengariLoaded();

    const {
      lua,
      lauxlib,
      lualib,
      to_luastring,
      to_jsstring,
    } = window.fengari;

    const logs = [];
    const L = lauxlib.luaL_newstate();

    lualib.luaL_openlibs(L);

    lua.lua_pushjsfunction(L, () => {
      const total = lua.lua_gettop(L);
      const parts = [];

      for (let i = 1; i <= total; i += 1) {
        lauxlib.luaL_tolstring(L, i);
        parts.push(to_jsstring(lua.lua_tostring(L, -1)));
        lua.lua_pop(L, 1);
      }

      logs.push(parts.join("\t"));
      return 0;
    });
    lua.lua_setglobal(L, to_luastring("print"));

    const code = editor.value;
    const loadStatus = lauxlib.luaL_loadstring(L, to_luastring(code));

    if (loadStatus !== lua.LUA_OK) {
      const err = to_jsstring(lua.lua_tostring(L, -1));
      setOutput(`Error de sintaxis:\n${err}`);
      return;
    }

    const runStatus = lua.lua_pcall(L, 0, lua.LUA_MULTRET, 0);

    if (runStatus !== lua.LUA_OK) {
      const err = to_jsstring(lua.lua_tostring(L, -1));
      setOutput(`Error de ejecución:\n${err}`);
      return;
    }

    setOutput(logs.length > 0 ? logs.join("\n") : "(sin salida)");
  } catch (error) {
    setOutput(error.message || String(error));
  }
}

runBtn.addEventListener("click", executeLua);
clearBtn.addEventListener("click", () => setOutput("Consola limpia."));
