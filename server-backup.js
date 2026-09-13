require("dotenv").config();

const express = require("express");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const CAMINHO_DADOS = "./dados.json";


// ==========================================
// PROTEÇÃO DO PAINEL ADMIN
// ==========================================

const ADMIN_TOKEN =
    crypto.randomBytes(32).toString("hex");


function adminAutenticado(req) {

    const cookies =
        req.headers.cookie || "";

    return cookies.includes(
        `admin_token=${ADMIN_TOKEN}`
    );

}


// ==========================================
// BLOQUEAR ACESSO DIRETO AO ADMIN
// ==========================================

app.use((req, res, next) => {

    if (req.path === "/admin.html") {

        if (!adminAutenticado(req)) {

            return res.redirect(
                "/login.html"
            );

        }

    }

    next();

});


app.use(express.static(__dirname));


// ==========================================
// CONFIGURAÇÃO DE UPLOAD DE IMAGENS
// ==========================================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        const pastaUploads =
            path.join(__dirname, "uploads");

        if (!fs.existsSync(pastaUploads)) {

            fs.mkdirSync(
                pastaUploads,
                { recursive: true }
            );

        }

        cb(null, pastaUploads);

    },

    filename: function (req, file, cb) {

        const extensao =
            path.extname(file.originalname);

        const nomeArquivo =
            Date.now() +
            "-" +
            crypto.randomBytes(8).toString("hex") +
            extensao;

        cb(null, nomeArquivo);

    }

});


const upload = multer({

    storage: storage,

    limits: {

        fileSize: 5 * 1024 * 1024

    },

    fileFilter: function (req, file, cb) {

        const tiposPermitidos = [

            "image/jpeg",
            "image/png",
            "image/webp"

        ];

        if (
            tiposPermitidos.includes(
                file.mimetype
            )
        ) {

            cb(null, true);

        } else {

            cb(
                new Error(
                    "Apenas JPG, PNG ou WEBP são permitidos."
                )
            );

        }

    }

});


// ==========================================
// LOGIN ADMINISTRATIVO
// ==========================================

app.post("/api/login", (req, res) => {

    const { senha } = req.body;

    const SENHA_ADMIN =
        process.env.ADMIN_PASSWORD;


    if (!SENHA_ADMIN) {

        return res.status(500).json({

            erro:
                "Senha administrativa não configurada."

        });

    }


    if (senha !== SENHA_ADMIN) {

        return res.status(401).json({

            erro:
                "Senha incorreta."

        });

    }


    res.setHeader(

        "Set-Cookie",

        `admin_token=${ADMIN_TOKEN}; HttpOnly; Path=/; SameSite=Strict`

    );


    res.json({

        sucesso: true

    });

});


// ==========================================
// SAIR DO PAINEL ADMIN
// ==========================================

app.post("/api/logout", (req, res) => {

    res.setHeader(

        "Set-Cookie",

        "admin_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict"

    );


    res.json({

        sucesso: true

    });

});


// ==========================================
// LISTAR TODOS OS REGISTROS - ADMIN
// ==========================================

app.get("/api/registros", (req, res) => {

    if (!adminAutenticado(req)) {

        return res.status(401).json({

            erro:
                "Acesso não autorizado."

        });

    }


    try {

        const arquivo =
            fs.readFileSync(

                CAMINHO_DADOS,

                "utf8"

            );


        const banco =
            JSON.parse(arquivo);


        res.json(

            banco.registros || []

        );


    } catch (erro) {

        console.error(erro);


        res.status(500).json({

            erro:
                "Erro ao carregar os registros."

        });

    }

});


// ==========================================
// PESQUISAR REGISTROS
// ==========================================

app.get("/api/pesquisar", (req, res) => {

    const termo =
        String(

            req.query.termo || ""

        )
        .trim()
        .toLowerCase();


    if (!termo) {

        return res.json([]);

    }


    try {

        const arquivo =
            fs.readFileSync(

                CAMINHO_DADOS,

                "utf8"

            );


        const banco =
            JSON.parse(arquivo);


        const resultados =
            (banco.registros || []).filter(

                registro => {

                    return (

                        String(
                            registro.nome || ""
                        )
                        .toLowerCase()
                        .includes(termo)

                        ||

                        String(
                            registro.usuario || ""
                        )
                        .toLowerCase()
                        .includes(termo)

                        ||

                        String(
                            registro.descricao || ""
                        )
                        .toLowerCase()
                        .includes(termo)

                    );

                }

            );


        res.json(resultados);


    } catch (erro) {

        console.error(erro);


        res.status(500).json({

            erro:
                "Erro ao consultar os dados."

        });

    }

});


// ==========================================
// BUSCAR REGISTRO POR ID
// ==========================================

app.get("/api/registro/:id", (req, res) => {

    const id =
        String(req.params.id);


    try {

        const arquivo =
            fs.readFileSync(

                CAMINHO_DADOS,

                "utf8"

            );


        const banco =
            JSON.parse(arquivo);


        const registro =
            (banco.registros || []).find(

                item =>
                    String(item.id) === id

            );


        if (!registro) {

            return res.status(404).json({

                erro:
                    "Registro não encontrado."

            });

        }


        res.json(registro);


    } catch (erro) {

        console.error(erro);


        res.status(500).json({

            erro:
                "Erro ao consultar o registro."

        });

    }

});


// ==========================================
// CADASTRAR NOVO REGISTRO COM IMAGEM
// ==========================================

app.post(
    "/api/registro",
    upload.single("imagem"),
    (req, res) => {

        if (!adminAutenticado(req)) {

            return res.status(401).json({

                erro:
                    "Acesso não autorizado."

            });

        }


        const {

            nome,
            usuario,
            descricao,
            status

        } = req.body;


        if (

            !nome ||
            !usuario ||
            !descricao ||
            !status

        ) {

            return res.status(400).json({

                erro:
                    "Preencha todos os campos."

            });

        }


        try {

            const arquivo =
                fs.readFileSync(

                    CAMINHO_DADOS,

                    "utf8"

                );


            const banco =
                JSON.parse(arquivo);


            if (
                !Array.isArray(
                    banco.registros
                )
            ) {

                banco.registros = [];

            }


            const registros =
                banco.registros;


            const novoId =
                registros.length > 0

                    ? Math.max(

                        ...registros.map(

                            item =>
                                Number(item.id) || 0

                        )

                    ) + 1

                    : 1;


            const novoRegistro = {

                id: novoId,

                nome:
                    String(nome).trim(),

                usuario:
                    String(usuario).trim(),

                descricao:
                    String(descricao).trim(),

                status:
                    String(status).trim(),

                imagem:
                    req.file
                        ? `/uploads/${req.file.filename}`
                        : ""

            };


            registros.push(
                novoRegistro
            );


            fs.writeFileSync(

                CAMINHO_DADOS,

                JSON.stringify(

                    banco,

                    null,

                    2

                ),

                "utf8"

            );


            res.json({

                sucesso: true,

                registro:
                    novoRegistro

            });


        } catch (erro) {

            console.error(
                "ERRO AO SALVAR REGISTRO:",
                erro
            );


            res.status(500).json({

                erro:
                    "Erro ao salvar o registro."

            });

        }

    }
);


// ==========================================
// EDITAR REGISTRO
// ==========================================

app.put("/api/registro/:id", (req, res) => {

    if (!adminAutenticado(req)) {

        return res.status(401).json({

            erro:
                "Acesso não autorizado."

        });

    }


    const id =
        String(req.params.id);


    const {

        nome,
        usuario,
        descricao,
        status

    } = req.body;


    if (

        !nome ||
        !usuario ||
        !descricao ||
        !status

    ) {

        return res.status(400).json({

            erro:
                "Preencha todos os campos."

        });

    }


    try {

        const arquivo =
            fs.readFileSync(

                CAMINHO_DADOS,

                "utf8"

            );


        const banco =
            JSON.parse(arquivo);


        const registros =
            banco.registros || [];


        const indice =
            registros.findIndex(

                item =>
                    String(item.id) === id

            );


        if (indice === -1) {

            return res.status(404).json({

                erro:
                    "Registro não encontrado."

            });

        }


        registros[indice] = {

            id:
                registros[indice].id,

            nome:
                String(nome).trim(),

            usuario:
                String(usuario).trim(),

            descricao:
                String(descricao).trim(),

            status:
                String(status).trim(),

            imagem:
                registros[indice].imagem || ""

        };


        banco.registros =
            registros;


        fs.writeFileSync(

            CAMINHO_DADOS,

            JSON.stringify(

                banco,

                null,

                2

            ),

            "utf8"

        );


        res.json({

            sucesso: true,

            registro:
                registros[indice]

        });


    } catch (erro) {

        console.error(erro);


        res.status(500).json({

            erro:
                "Erro ao editar o registro."

        });

    }

});


// ==========================================
// EXCLUIR REGISTRO
// ==========================================

app.delete("/api/registro/:id", (req, res) => {

    if (!adminAutenticado(req)) {

        return res.status(401).json({

            erro:
                "Acesso não autorizado."

        });

    }


    const id =
        String(req.params.id);


    try {

        const arquivo =
            fs.readFileSync(

                CAMINHO_DADOS,

                "utf8"

            );


        const banco =
            JSON.parse(arquivo);


        const registros =
            banco.registros || [];


        const indice =
            registros.findIndex(

                item =>
                    String(item.id) === id

            );


        if (indice === -1) {

            return res.status(404).json({

                erro:
                    "Registro não encontrado."

            });

        }


        const registroExcluido =
            registros[indice];


        registros.splice(

            indice,

            1

        );


        banco.registros =
            registros;


        fs.writeFileSync(

            CAMINHO_DADOS,

            JSON.stringify(

                banco,

                null,

                2

            ),

            "utf8"

        );


        res.json({

            sucesso: true,

            mensagem:
                "Registro excluído com sucesso.",

            registro:
                registroExcluido

        });


    } catch (erro) {

        console.error(erro);


        res.status(500).json({

            erro:
                "Erro ao excluir o registro."

        });

    }

});


// ==========================================
// TRATAMENTO DE ERROS DO UPLOAD
// ==========================================

app.use((erro, req, res, next) => {

    if (erro instanceof multer.MulterError) {

        if (erro.code === "LIMIT_FILE_SIZE") {

            return res.status(400).json({

                erro:
                    "A imagem é muito grande. O limite é 5 MB."

            });

        }

        return res.status(400).json({

            erro:
                "Erro no upload da imagem."

        });

    }


    if (erro) {

        return res.status(400).json({

            erro:
                erro.message ||
                "Erro no servidor."

        });

    }


    next();

});


// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(PORT, () => {

    console.log(

        `Servidor funcionando na porta ${PORT}`

    );

});