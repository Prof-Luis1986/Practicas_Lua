const collectionEditor = document.getElementById("collection-editor");
const collectionOutput = document.getElementById("collection-output");
const loadCollectionBtn = document.getElementById("load-collection");
const resetCollectionBtn = document.getElementById("reset-collection");
const commandEditor = document.getElementById("mongo-command");
const runCommandBtn = document.getElementById("run-command");
const clearCommandBtn = document.getElementById("clear-command");
const resetCommandBtn = document.getElementById("reset-command");
const commandOutput = document.getElementById("command-output");

const defaultCollection = [
  {
    _id: "a1",
    nombre: "Andrea",
    edad: 24,
    area: "Backend",
    ciudad: "Bogotá",
    habilidades: ["Lua", "Node", "MongoDB"],
    activo: true,
  },
  {
    _id: "b2",
    nombre: "Luis",
    edad: 21,
    area: "Frontend",
    ciudad: "Lima",
    habilidades: ["React", "CSS", "UX"],
    activo: true,
  },
  {
    _id: "c3",
    nombre: "Valentina",
    edad: 27,
    area: "Data",
    ciudad: "CDMX",
    habilidades: ["Python", "ETL", "SQL"],
    activo: false,
  },
  {
    _id: "d4",
    nombre: "Mateo",
    edad: 23,
    area: "Backend",
    ciudad: "Quito",
    habilidades: ["Go", "Redis", "APIs"],
    activo: true,
  },
  {
    _id: "e5",
    nombre: "Sofia",
    edad: 29,
    area: "Data",
    ciudad: "Montevideo",
    habilidades: ["R", "MongoDB", "Tableau"],
    activo: true,
  },
  {
    _id: "f6",
    nombre: "Carlos",
    edad: 20,
    area: "Backend",
    ciudad: "Bogotá",
    habilidades: ["Lua", "Docker"],
    activo: false,
  },
  {
    _id: "g7",
    nombre: "Mariana",
    edad: 25,
    area: "Frontend",
    ciudad: "CDMX",
    habilidades: ["Vue", "TypeScript", "UI"],
    activo: true,
  },
  {
    _id: "h8",
    nombre: "Diego",
    edad: 31,
    area: "Backend",
    ciudad: "Lima",
    habilidades: ["Java", "MongoDB", "Kubernetes"],
    activo: true,
  },
];

const defaultCollectionText = formatJson(defaultCollection);
const defaultCommandText = commandEditor ? commandEditor.value.trim() : "";
const defaultDbName = "escuela";
let activeCollectionName = "usuarios";
const dbs = new Map();
let currentDbName = defaultDbName;

function setCommandOutput(text) {
  if (commandOutput) {
    commandOutput.textContent = text;
  }
}

function ensureDb(name) {
  if (!dbs.has(name)) {
    dbs.set(name, { collections: new Map() });
  }
  return dbs.get(name);
}

function getDb(name) {
  return dbs.get(name) || null;
}

function getCollection(dbName, collectionName, create = true) {
  const db = create ? ensureDb(dbName) : getDb(dbName);
  if (!db) {
    return null;
  }
  if (!db.collections.has(collectionName)) {
    if (!create) {
      return null;
    }
    db.collections.set(collectionName, []);
  }
  return db.collections.get(collectionName);
}

function setActiveCollection(data) {
  const db = ensureDb(currentDbName);
  db.collections.set(activeCollectionName, data);
}

function setActiveCollectionName(name) {
  activeCollectionName = name;
}

function getActiveCollection() {
  return getCollection(currentDbName, activeCollectionName, true);
}

function getActiveCollectionSafe() {
  return getCollection(currentDbName, activeCollectionName, false) || [];
}

function formatJson(value) {
  return JSON.stringify(value, null, 2);
}

function formatJsonCompact(value) {
  return JSON.stringify(value);
}

function parseEditor(value, label) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    throw new Error(`${label}: ${error.message || String(error)}`);
  }
}

function loadCollection() {
  try {
    const raw = collectionEditor.value.trim();
    if (!raw) {
      throw new Error("Colección: no hay contenido para cargar.");
    }

    const insertManyMatch = raw.match(
      /^db\.([A-Za-z_][\w]*)\.insertMany\(([\s\S]+)\)\s*;?\s*$/i,
    );
    if (insertManyMatch) {
      const collectionName = insertManyMatch[1];
      const docs = parseMongoValue(insertManyMatch[2], "Documentos");
      if (!Array.isArray(docs)) {
        throw new Error("Documentos inválidos. Usa un arreglo.");
      }
      setActiveCollectionName(collectionName);
      setActiveCollection(docs);
      collectionEditor.value = formatJson(docs);
      renderCollection();
      setCommandOutput(`Colección cargada desde insertMany: ${collectionName}.`);
      return;
    }

    const insertOneMatch = raw.match(
      /^db\.([A-Za-z_][\w]*)\.insertOne\(([\s\S]+)\)\s*;?\s*$/i,
    );
    if (insertOneMatch) {
      const collectionName = insertOneMatch[1];
      const doc = parseMongoValue(insertOneMatch[2], "Documento");
      if (!isPlainObject(doc)) {
        throw new Error("Documento inválido.");
      }
      setActiveCollectionName(collectionName);
      setActiveCollection([doc]);
      collectionEditor.value = formatJson([doc]);
      renderCollection();
      setCommandOutput(`Colección cargada desde insertOne: ${collectionName}.`);
      return;
    }

    const data = parseEditor(raw, "Colección");
    if (!Array.isArray(data)) {
      throw new Error("Colección: debe ser un arreglo JSON de documentos.");
    }
    setActiveCollection(data);
    renderCollection();
    setCommandOutput("Colección cargada. Puedes consultarla desde la consola.");
  } catch (error) {
    setCommandOutput(error.message || String(error));
  }
}

function resetCollection() {
  setActiveCollection([...defaultCollection]);
  collectionEditor.value = defaultCollectionText;
  renderCollection();
  setCommandOutput("Colección restablecida al ejemplo.");
}

function compareValues(left, right) {
  if (left === right) {
    return 0;
  }
  if (left === undefined) {
    return 1;
  }
  if (right === undefined) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  if (left < right) {
    return -1;
  }
  return 0;
}

function matchOperator(fieldValue, operator, expected) {
  switch (operator) {
    case "$eq":
      return fieldValue === expected;
    case "$ne":
      return fieldValue !== expected;
    case "$gt":
      return fieldValue > expected;
    case "$gte":
      return fieldValue >= expected;
    case "$lt":
      return fieldValue < expected;
    case "$lte":
      return fieldValue <= expected;
    case "$in":
      return Array.isArray(expected) && expected.includes(fieldValue);
    case "$nin":
      return Array.isArray(expected) && !expected.includes(fieldValue);
    case "$exists":
      return expected ? fieldValue !== undefined : fieldValue === undefined;
    case "$regex": {
      if (typeof expected !== "string") {
        return false;
      }
      const regex = new RegExp(expected, "i");
      return typeof fieldValue === "string" && regex.test(fieldValue);
    }
    default:
      return false;
  }
}

function matchField(fieldValue, condition) {
  if (!isPlainObject(condition)) {
    if (Array.isArray(fieldValue)) {
      return fieldValue.includes(condition);
    }
    return fieldValue === condition;
  }

  return Object.entries(condition).every(([operator, expected]) =>
    matchOperator(fieldValue, operator, expected),
  );
}

function matchDocument(doc, filter) {
  if (!filter || !isPlainObject(filter)) {
    return true;
  }

  if (Array.isArray(filter.$and)) {
    return filter.$and.every((item) => matchDocument(doc, item));
  }

  if (Array.isArray(filter.$or)) {
    return filter.$or.some((item) => matchDocument(doc, item));
  }

  return Object.entries(filter).every(([field, condition]) => {
    if (field.startsWith("$")) {
      return true;
    }
    return matchField(doc[field], condition);
  });
}

function applyProjection(doc, projection) {
  if (!projection || !isPlainObject(projection)) {
    return { ...doc };
  }

  const entries = Object.entries(projection);
  if (entries.length === 0) {
    return { ...doc };
  }

  const includeMode = entries.some(([, value]) => value === 1 || value === true);
  const result = {};

  if (includeMode) {
    entries.forEach(([field, value]) => {
      if (value && field in doc) {
        result[field] = doc[field];
      }
    });

    if (projection._id !== 0 && projection._id !== false && "_id" in doc) {
      result._id = doc._id;
    }

    return result;
  }

  const excluded = new Set(entries.filter(([, value]) => value === 0).map(([key]) => key));
  Object.entries(doc).forEach(([field, value]) => {
    if (!excluded.has(field)) {
      result[field] = value;
    }
  });

  return result;
}

function applySort(docs, sortSpec) {
  if (!sortSpec || !isPlainObject(sortSpec)) {
    return docs;
  }

  const fields = Object.entries(sortSpec);
  if (fields.length === 0) {
    return docs;
  }

  return [...docs].sort((a, b) => {
    for (const [field, direction] of fields) {
      const order = direction === -1 ? -1 : 1;
      const comparison = compareValues(a[field], b[field]);
      if (comparison !== 0) {
        return comparison * order;
      }
    }
    return 0;
  });
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function renderCollection() {
  collectionOutput.textContent = formatJson(getActiveCollectionSafe());
}

function refreshActiveEditor() {
  collectionEditor.value = formatJson(getActiveCollectionSafe());
  renderCollection();
}

function parseCommandArguments(raw) {
  const args = [];
  let current = "";
  let depth = 0;
  let inString = false;
  let stringChar = "";

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    if (inString) {
      current += char;
      if (char === stringChar && raw[i - 1] !== "\\") {
        inString = false;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      stringChar = char;
      current += char;
      continue;
    }

    if (char === "{" || char === "[" || char === "(") {
      depth += 1;
    } else if (char === "}" || char === "]" || char === ")") {
      depth -= 1;
    }

    if (char === "," && depth === 0) {
      args.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    args.push(current.trim());
  }

  return args;
}

function normalizeMongoJson(raw) {
  let normalized = raw.trim();
  if (!normalized) {
    return "";
  }
  normalized = normalized.replace(/'/g, '"');
  normalized = normalized.replace(/([{,]\s*)([$A-Za-z_][\w$]*)\s*:/g, '$1"$2":');
  return normalized;
}

function parseMongoValue(raw, label) {
  const normalized = normalizeMongoJson(raw);
  if (!normalized) {
    return null;
  }
  try {
    return JSON.parse(normalized);
  } catch (error) {
    throw new Error(`${label}: ${error.message || String(error)}`);
  }
}

function splitCommands(raw) {
  const commands = [];
  let current = "";
  let depth = 0;
  let inString = false;
  let stringChar = "";

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];

    if (inString) {
      current += char;
      if (char === stringChar && raw[i - 1] !== "\\") {
        inString = false;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      stringChar = char;
      current += char;
      continue;
    }

    if (char === "{" || char === "[" || char === "(") {
      depth += 1;
    } else if (char === "}" || char === "]" || char === ")") {
      depth -= 1;
    }

    if ((char === ";" || char === "\n") && depth === 0) {
      const trimmed = current.trim();
      if (trimmed) {
        commands.push(trimmed);
      }
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    commands.push(current.trim());
  }

  return commands;
}

function getCollectionList(dbName) {
  const db = getDb(dbName);
  if (!db) {
    return [];
  }
  return Array.from(db.collections.keys());
}

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

function applyUpdate(doc, updateSpec) {
  if (!isPlainObject(updateSpec)) {
    return false;
  }

  const operators = Object.keys(updateSpec).filter((key) => key.startsWith("$"));
  if (operators.length === 0) {
    return false;
  }

  let changed = false;

  if (updateSpec.$set && isPlainObject(updateSpec.$set)) {
    Object.entries(updateSpec.$set).forEach(([key, value]) => {
      if (doc[key] !== value) {
        doc[key] = value;
        changed = true;
      }
    });
  }

  if (updateSpec.$inc && isPlainObject(updateSpec.$inc)) {
    Object.entries(updateSpec.$inc).forEach(([key, value]) => {
      const increment = Number(value);
      if (!Number.isNaN(increment)) {
        const current = typeof doc[key] === "number" ? doc[key] : 0;
        doc[key] = current + increment;
        changed = true;
      }
    });
  }

  if (updateSpec.$unset && isPlainObject(updateSpec.$unset)) {
    Object.keys(updateSpec.$unset).forEach((key) => {
      if (key in doc) {
        delete doc[key];
        changed = true;
      }
    });
  }

  return changed;
}

function executeFind(collectionName, args, chain) {
  const filter = args[0] ? parseMongoValue(args[0], "Filtro") : null;
  const projection = args[1] ? parseMongoValue(args[1], "Proyección") : null;
  let results = getCollection(currentDbName, collectionName, true).filter((doc) =>
    matchDocument(doc, filter),
  );

  chain.forEach((item) => {
    if (item.name === "sort") {
      const sortSpec = parseMongoValue(item.args, "Sort");
      results = applySort(results, sortSpec);
    }
  });

  chain.forEach((item) => {
    if (item.name === "skip") {
      const skipValue = Number(item.args);
      if (!Number.isNaN(skipValue) && skipValue > 0) {
        results = results.slice(skipValue);
      }
    }
  });

  chain.forEach((item) => {
    if (item.name === "limit") {
      const limitValue = Number(item.args);
      if (!Number.isNaN(limitValue) && limitValue >= 0) {
        results = results.slice(0, limitValue);
      }
    }
  });

  const projected = results.map((doc) => applyProjection(doc, projection));
  const pretty = chain.some((item) => item.name === "pretty");
  return pretty ? formatJson(projected) : formatJsonCompact(projected);
}

function executeCommand(rawCommand) {
  const command = rawCommand.trim();
  if (!command) {
    return "Comando vacío.";
  }

  if (/^show\s+dbs$/i.test(command)) {
    return formatJson(Array.from(dbs.keys()));
  }

  const useMatch = command.match(/^use\s+([A-Za-z0-9_-]+)$/i);
  if (useMatch) {
    currentDbName = useMatch[1];
    refreshActiveEditor();
    return `Base actual: ${currentDbName}`;
  }

  if (/^db$/i.test(command)) {
    return currentDbName;
  }

  if (/^db\.dropDatabase\(\)$/i.test(command)) {
    dbs.delete(currentDbName);
    refreshActiveEditor();
    return `Base eliminada: ${currentDbName}`;
  }

  if (/^show\s+collections$/i.test(command)) {
    return formatJson(getCollectionList(currentDbName));
  }

  const createCollectionMatch = command.match(/^db\.createCollection\(([\s\S]+)\)$/i);
  if (createCollectionMatch) {
    const collectionName = parseMongoValue(createCollectionMatch[1], "Colección");
    if (typeof collectionName !== "string") {
      return "Colección: usa un nombre entre comillas.";
    }
    getCollection(currentDbName, collectionName, true);
    return `Colección creada: ${collectionName}`;
  }

  const dropCollectionMatch = command.match(/^db\.([A-Za-z_][\w]*)\.drop\(\)$/i);
  if (dropCollectionMatch) {
    const collectionName = dropCollectionMatch[1];
    const db = getDb(currentDbName);
    if (db && db.collections.has(collectionName)) {
      db.collections.delete(collectionName);
      if (collectionName === activeCollectionName) {
        refreshActiveEditor();
      }
      return `Colección eliminada: ${collectionName}`;
    }
    return `La colección ${collectionName} no existe.`;
  }

  const insertOneMatch = command.match(
    /^db\.([A-Za-z_][\w]*)\.insertOne\(([\s\S]+)\)$/i,
  );
  if (insertOneMatch) {
    const collectionName = insertOneMatch[1];
    const doc = parseMongoValue(insertOneMatch[2], "Documento");
    if (!isPlainObject(doc)) {
      return "Documento inválido.";
    }
    if (!doc._id) {
      doc._id = generateId();
    }
    const collectionData = getCollection(currentDbName, collectionName, true);
    collectionData.push(doc);
    if (collectionName === activeCollectionName) {
      renderCollection();
    }
    return formatJson({ insertedId: doc._id });
  }

  const insertManyMatch = command.match(
    /^db\.([A-Za-z_][\w]*)\.insertMany\(([\s\S]+)\)$/i,
  );
  if (insertManyMatch) {
    const collectionName = insertManyMatch[1];
    const docs = parseMongoValue(insertManyMatch[2], "Documentos");
    if (!Array.isArray(docs)) {
      return "Documentos inválidos. Usa un arreglo.";
    }
    const collectionData = getCollection(currentDbName, collectionName, true);
    const insertedIds = {};
    let insertedCount = 0;
    docs.forEach((doc, index) => {
      if (isPlainObject(doc)) {
        if (!doc._id) {
          doc._id = generateId();
        }
        insertedIds[index] = doc._id;
        collectionData.push(doc);
        insertedCount += 1;
      }
    });
    if (collectionName === activeCollectionName) {
      renderCollection();
    }
    return formatJson({ insertedCount, insertedIds });
  }

  const updateMatch = command.match(
    /^db\.([A-Za-z_][\w]*)\.update(One|Many)\(([\s\S]+)\)$/i,
  );
  if (updateMatch) {
    const collectionName = updateMatch[1];
    const updateType = updateMatch[2].toLowerCase();
    const args = parseCommandArguments(updateMatch[3]);
    const filter = parseMongoValue(args[0] || "{}", "Filtro");
    const updateSpec = parseMongoValue(args[1] || "{}", "Actualización");
    if (!isPlainObject(updateSpec)) {
      return "Actualización inválida.";
    }
    const collectionData = getCollection(currentDbName, collectionName, true);
    let matchedCount = 0;
    let modifiedCount = 0;
    for (const doc of collectionData) {
      if (matchDocument(doc, filter)) {
        matchedCount += 1;
        if (applyUpdate(doc, updateSpec)) {
          modifiedCount += 1;
        }
        if (updateType === "one") {
          break;
        }
      }
    }
    if (collectionName === activeCollectionName) {
      renderCollection();
    }
    return formatJson({ matchedCount, modifiedCount });
  }

  const deleteMatch = command.match(
    /^db\.([A-Za-z_][\w]*)\.delete(One|Many)\(([\s\S]*)\)$/i,
  );
  if (deleteMatch) {
    const collectionName = deleteMatch[1];
    const deleteType = deleteMatch[2].toLowerCase();
    const filter = parseMongoValue(deleteMatch[3] || "{}", "Filtro");
    const collectionData = getCollection(currentDbName, collectionName, true);
    let deletedCount = 0;
    const remaining = [];
    collectionData.forEach((doc) => {
      if (matchDocument(doc, filter)) {
        if (deleteType === "one" && deletedCount > 0) {
          remaining.push(doc);
        } else {
          deletedCount += 1;
        }
      } else {
        remaining.push(doc);
      }
    });
    getCollection(currentDbName, collectionName, true).length = 0;
    remaining.forEach((doc) => getCollection(currentDbName, collectionName, true).push(doc));
    if (collectionName === activeCollectionName) {
      renderCollection();
    }
    return formatJson({ deletedCount });
  }

  const findMatch = command.match(/^db\.([A-Za-z_][\w]*)\.find\(([\s\S]*)\)([\s\S]*)$/i);
  if (findMatch) {
    const collectionName = findMatch[1];
    const args = parseCommandArguments(findMatch[2]);
    const chainRaw = findMatch[3] || "";
    const chain = [];
    const chainRegex = /\.(\w+)\(([^)]*)\)/g;
    let chainMatch = chainRegex.exec(chainRaw);
    while (chainMatch) {
      chain.push({ name: chainMatch[1].toLowerCase(), args: chainMatch[2].trim() });
      chainMatch = chainRegex.exec(chainRaw);
    }
    return executeFind(collectionName, args, chain);
  }

  const findOneMatch = command.match(
    /^db\.([A-Za-z_][\w]*)\.findOne\(([\s\S]*)\)$/i,
  );
  if (findOneMatch) {
    const collectionName = findOneMatch[1];
    const filter = parseMongoValue(findOneMatch[2] || "{}", "Filtro");
    const collectionData = getCollection(currentDbName, collectionName, true);
    const doc = collectionData.find((item) => matchDocument(item, filter)) || null;
    return formatJson(doc);
  }

  const countMatch = command.match(
    /^db\.([A-Za-z_][\w]*)\.countDocuments\(([\s\S]*)\)$/i,
  );
  if (countMatch) {
    const collectionName = countMatch[1];
    const filter = parseMongoValue(countMatch[2] || "{}", "Filtro");
    const collectionData = getCollection(currentDbName, collectionName, true);
    const count = collectionData.filter((doc) => matchDocument(doc, filter)).length;
    return String(count);
  }

  const aggregateMatch = command.match(
    /^db\.([A-Za-z_][\w]*)\.aggregate\(([\s\S]+)\)$/i,
  );
  if (aggregateMatch) {
    const collectionName = aggregateMatch[1];
    const pipeline = parseMongoValue(aggregateMatch[2], "Pipeline");
    if (!Array.isArray(pipeline)) {
      return "Pipeline inválida. Usa un arreglo.";
    }
    let results = getCollection(currentDbName, collectionName, true).map((doc) => ({ ...doc }));
    pipeline.forEach((stage) => {
      if (stage.$match) {
        results = results.filter((doc) => matchDocument(doc, stage.$match));
      } else if (stage.$group && isPlainObject(stage.$group)) {
        const { _id, ...accumulators } = stage.$group;
        const groups = new Map();

        results.forEach((doc) => {
          const key =
            typeof _id === "string" && _id.startsWith("$") ? doc[_id.slice(1)] : _id;
          if (!groups.has(key)) {
            const base = { _id: key };
            Object.keys(accumulators).forEach((field) => {
              base[field] = 0;
            });
            base.__avgMeta = {};
            groups.set(key, base);
          }

          const group = groups.get(key);
          Object.entries(accumulators).forEach(([field, spec]) => {
            if (!spec || typeof spec !== "object") {
              return;
            }
            if ("$sum" in spec) {
              const sumValue = spec.$sum;
              if (typeof sumValue === "number") {
                group[field] += sumValue;
              } else if (typeof sumValue === "string" && sumValue.startsWith("$")) {
                const fieldValue = doc[sumValue.slice(1)];
                group[field] += typeof fieldValue === "number" ? fieldValue : 0;
              }
            }
            if ("$avg" in spec) {
              const avgValue = spec.$avg;
              const meta = group.__avgMeta[field] || { sum: 0, count: 0 };
              if (typeof avgValue === "number") {
                meta.sum += avgValue;
                meta.count += 1;
              } else if (typeof avgValue === "string" && avgValue.startsWith("$")) {
                const fieldValue = doc[avgValue.slice(1)];
                if (typeof fieldValue === "number") {
                  meta.sum += fieldValue;
                  meta.count += 1;
                }
              }
              group.__avgMeta[field] = meta;
            }
          });
        });

        results = Array.from(groups.values()).map((group) => {
          if (group.__avgMeta) {
            Object.entries(group.__avgMeta).forEach(([field, meta]) => {
              group[field] = meta.count > 0 ? meta.sum / meta.count : 0;
            });
            delete group.__avgMeta;
          }
          return group;
        });
      }
    });
    return formatJson(results);
  }

  return "Comando no reconocido.";
}

function runCommand() {
  if (!commandEditor) {
    return;
  }
  const raw = commandEditor.value.trim();
  if (!raw) {
    setCommandOutput("Escribe un comando.");
    return;
  }
  const commands = splitCommands(raw);
  const outputs = commands.map((cmd) => `> ${cmd}\n${executeCommand(cmd)}`);
  setCommandOutput(outputs.join("\n\n"));
}

loadCollectionBtn.addEventListener("click", loadCollection);
resetCollectionBtn.addEventListener("click", resetCollection);
if (runCommandBtn) {
  runCommandBtn.addEventListener("click", runCommand);
}
if (clearCommandBtn) {
  clearCommandBtn.addEventListener("click", () => setCommandOutput("Salida limpia."));
}
if (resetCommandBtn) {
  resetCommandBtn.addEventListener("click", () => {
    commandEditor.value = defaultCommandText;
    setCommandOutput("Ejemplos restablecidos. Ejecuta un comando para ver resultados.");
  });
}

setActiveCollection([...defaultCollection]);
collectionEditor.value = defaultCollectionText;
renderCollection();
