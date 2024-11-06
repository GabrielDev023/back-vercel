"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const imgen_1 = require("./imgen");
const utils_1 = require("./utils");
const app = (0, express_1.default)();
const port = process.env.PORT || 5300;
const corsOptions = {
    origin: "http://localhost:3000",
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus: 200,
};
app.use((0, cors_1.default)(corsOptions));
app.get("/", (_req, res) => {
    res.send("Listening");
});
app.get("/get-image-request-id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { _U, prompt } = req.query;
    if (!_U || !prompt || typeof _U !== "string" || typeof prompt !== "string")
        return res.status(200).json({
            error: { message: "Parâmetros inválidos", type: "InvalidQueryParam" },
        });
    let maxRetries = 5;
    let error = "";
    while (maxRetries > 0) {
        try {
            const requestId = yield (0, imgen_1.getCreateImageRequestId)(_U, prompt);
            return res.status(200).json(requestId);
        }
        catch (err) {
            console.log(`error: ${err}. Retrying...`);
            // return res.status(200).json({ error });
            error = err;
        }
        maxRetries -= 1;
        yield (0, utils_1.sleep)(2000);
    }
    return res.status(200).json({ error });
}));
app.get("/get-imgs-links", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { _U, prompt } = req.query;
    if (!_U || !prompt || typeof _U !== "string" || typeof prompt !== "string")
        return res.status(200).json({
            error: { message: "Parâmetros inválidos", type: "InvalidQueryParam" },
        });
    try {
        const imgLinks = yield (0, imgen_1.getImgLinks)(_U, prompt);
        res.status(200).json(imgLinks);
    }
    catch (error) {
        console.log(error);
        res.status(200).json({ error });
    }
}));
app.get("/retry-get-imgs-links", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { _U, pollingUrl } = req.query;
    if (!_U ||
        !pollingUrl ||
        typeof _U !== "string" ||
        typeof pollingUrl !== "string")
        return res.status(200).json({
            error: { message: "Parâmetros inválidos", type: "InvalidQueryParam" },
        });
    try {
        const imgLinks = yield (0, imgen_1.getImgLinks)(_U, "", pollingUrl);
        res.status(200).json(imgLinks);
    }
    catch (error) {
        console.log(error);
        res.status(200).json({ error });
    }
}));
app.get("/get-request-id-status", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { _U, requestId } = req.query;
    if (!_U ||
        !requestId ||
        typeof _U !== "string" ||
        typeof requestId !== "string")
        return res.status(200).json({
            error: { message: "Parâmetros inválidos", type: "InvalidQueryParam" },
        });
    try {
        const status = yield (0, imgen_1.getRequestIdStatus)(_U, requestId);
        res.status(200).json(status);
    }
    catch (error) {
        console.log(error);
        res.status(200).json({ error });
    }
}));
app.listen(port, () => {
    console.log(`Server is listening at port ${port}`);
});
//# sourceMappingURL=server.js.map