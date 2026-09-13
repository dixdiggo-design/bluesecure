
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
// CONFIGURAÇÃO DE UPLOAD
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
// REGISTROS PÚBLICOS APROVADOS
// ==========================================

app.get("/api/registros-publicos", (req, res) => {

    try {

        const arquivo =
            fs.readFileSync(

                CAMINHO_DADOS,

                "utf8"

            );


        const banco =
            JSON.parse(arquivo);


        const registrosAprovados =
            (banco.registros || [])
                .filter(
                    registro =>
                        String(
                            registro.status || ""
                        ).toUpperCase() === "APROVADO"
                )
                .sort(
                    (a, b) =>
                        Number(b.id || 0) -
                        Number(a.id || 0)
                );


        res.json(
            registrosAprovados
        );


    } catch (erro) {

        console.error(erro);


        res.status(500).json({

            erro:
                "Erro ao carregar os registros públicos."

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
// CADASTRAR NOVO REGISTRO - ADMIN
// ==========================================

app.post("/api/registro", (req, res) => {

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
    } = req.body || {};


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
                ""

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

        console.error(erro);


        res.status(500).json({

            erro:
                "Erro ao salvar o registro."

        });

    }

});


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
    } = req.body || {};


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
// EXCLUIR REGISTRO E IMAGEM DA PROVA
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


        // ==========================================
        // APAGAR IMAGEM DA PROVA
        // ==========================================

        if (

            registroExcluido.imagem &&

            String(
                registroExcluido.imagem
            ).startsWith("/uploads/")

        ) {

            const nomeArquivo =
                path.basename(

                    registroExcluido.imagem

                );


            const caminhoImagem =
                path.join(

                    __dirname,

                    "uploads",

                    nomeArquivo

                );


            if (

                fs.existsSync(
                    caminhoImagem
                )

            ) {

                fs.unlinkSync(
                    caminhoImagem
                );


                console.log(

                    "Imagem da prova excluída:",

                    nomeArquivo

                );

            }

        }


        // ==========================================
        // REMOVER REGISTRO
        // ==========================================

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
                "Registro e imagem excluídos com sucesso.",

            registro:
                registroExcluido

        });


    } catch (erro) {

        console.error(

            "ERRO AO EXCLUIR REGISTRO:",

            erro

        );


        res.status(500).json({

            erro:
                "Erro ao excluir o registro."

        });

    }

});


// ==========================================
// ENVIO PÚBLICO DE SOLICITAÇÕES
// ==========================================

app.post(
    "/api/solicitacao",
    upload.single("imagem"),
    (req, res) => {

        const {
            nome,
            usuario,
            motivo,
            descricao
        } = req.body;


        if (
            !nome ||
            !usuario ||
            !motivo
        ) {

            return res.status(400).json({

                erro:
                    "Preencha nome, usuário e motivo da prova."

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
                    banco.solicitacoes
                )
            ) {

                banco.solicitacoes = [];

            }


            const solicitacoes =
                banco.solicitacoes;


            const novoId =
                solicitacoes.length > 0

                    ? Math.max(

                        ...solicitacoes.map(

                            item =>
                                Number(item.id) || 0

                        )

                    ) + 1

                    : 1;


            const novaSolicitacao = {

                id: novoId,

                nome:
                    String(nome).trim(),

                usuario:
                    String(usuario).trim(),

                motivo:
                    String(motivo).trim(),

                descricao:
                    String(
                        descricao || ""
                    ).trim(),

                imagem:
                    req.file
                        ? `/uploads/${req.file.filename}`
                        : "",

                status:
                    "PENDENTE",

                data:
                    new Date().toISOString()

            };


            solicitacoes.push(
                novaSolicitacao
            );


            banco.solicitacoes =
                solicitacoes;


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
                    "Solicitação enviada para análise.",

                solicitacao:
                    novaSolicitacao

            });


        } catch (erro) {

            console.error(erro);


            res.status(500).json({

                erro:
                    "Erro ao enviar a solicitação."

            });

        }

    }
);


// ==========================================
// LISTAR SOLICITAÇÕES - ADMIN
// ==========================================

app.get("/api/solicitacoes", (req, res) => {

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

            banco.solicitacoes || []

        );


    } catch (erro) {

        console.error(erro);


        res.status(500).json({

            erro:
                "Erro ao carregar as solicitações."

        });

    }

});


// ==========================================
// APROVAR SOLICITAÇÃO
// ==========================================

app.post(
    "/api/solicitacao/:id/aprovar",
    (req, res) => {

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


            if (
                !Array.isArray(
                    banco.solicitacoes
                )
            ) {

                banco.solicitacoes = [];

            }


            if (
                !Array.isArray(
                    banco.registros
                )
            ) {

                banco.registros = [];

            }


            const indice =
                banco.solicitacoes.findIndex(

                    item =>
                        String(item.id) === id

                );


            if (indice === -1) {

                return res.status(404).json({

                    erro:
                        "Solicitação não encontrada."

                });

            }


            const solicitacao =
                banco.solicitacoes[indice];


            if (
                solicitacao.status ===
                "APROVADO"
            ) {

                return res.status(400).json({

                    erro:
                        "Esta solicitação já foi aprovada."

                });

            }


            const registros =
                banco.registros;


            const novoRegistroId =
                registros.length > 0

                    ? Math.max(

                        ...registros.map(

                            item =>
                                Number(item.id) || 0

                        )

                    ) + 1

                    : 1;


            const novoRegistro = {

                id:
                    novoRegistroId,

                nome:
                    solicitacao.nome,

                usuario:
                    solicitacao.usuario,

                descricao:
                    solicitacao.motivo,

                status:
                    "APROVADO",

                imagem:
                    solicitacao.imagem || ""

            };


            registros.push(
                novoRegistro
            );


            banco.solicitacoes[indice] = {

                ...solicitacao,

                status:
                    "APROVADO",

                aprovadoEm:
                    new Date().toISOString()

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

                mensagem:
                    "Solicitação aprovada e publicada.",

                registro:
                    novoRegistro

            });


        } catch (erro) {

            console.error(erro);


            res.status(500).json({

                erro:
                    "Erro ao aprovar a solicitação."

            });

        }

    }
);


// ==========================================
// RECUSAR SOLICITAÇÃO
// ==========================================

app.post(
    "/api/solicitacao/:id/recusar",
    (req, res) => {

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


            if (
                !Array.isArray(
                    banco.solicitacoes
                )
            ) {

                banco.solicitacoes = [];

            }


            const indice =
                banco.solicitacoes.findIndex(

                    item =>
                        String(item.id) === id

                );


            if (indice === -1) {

                return res.status(404).json({

                    erro:
                        "Solicitação não encontrada."

                });

            }


            const solicitacao =
                banco.solicitacoes[indice];


            banco.solicitacoes[indice] = {

                ...solicitacao,

                status:
                    "RECUSADO",

                recusadoEm:
                    new Date().toISOString()

            };


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
                    "Solicitação recusada.",

                solicitacao:
                    banco.solicitacoes[indice]

            });


        } catch (erro) {

            console.error(erro);


            res.status(500).json({

                erro:
                    "Erro ao recusar a solicitação."

            });

        }

    }
);


// ==========================================
// EXCLUIR SOLICITAÇÃO - ADMIN
// ==========================================

app.delete(
    "/api/solicitacao/:id",
    (req, res) => {

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


            const solicitacoes =
                banco.solicitacoes || [];


            const indice =
                solicitacoes.findIndex(

                    item =>
                        String(item.id) === id

                );


            if (indice === -1) {

                return res.status(404).json({

                    erro:
                        "Solicitação não encontrada."

                });

            }


            const solicitacaoExcluida =
                solicitacoes[indice];


            solicitacoes.splice(

                indice,

                1

            );


            banco.solicitacoes =
                solicitacoes;


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
                    "Solicitação excluída.",

                solicitacao:
                    solicitacaoExcluida

            });


        } catch (erro) {

            console.error(erro);


            res.status(500).json({

                erro:
                    "Erro ao excluir a solicitação."

            });

        }

    }
);


// ==========================================
// TRATAR ERROS DE UPLOAD
// ==========================================

app.use(
    (erro, req, res, next) => {

        console.error(erro);

        if (erro) {

            return res.status(400).json({

                erro:
                    erro.message ||
                    "Erro no servidor."

            });

        }

        next();

    }
);


// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(
    PORT,
    () => {

        console.log(
            `Servidor funcionando na porta ${PORT}`
        );

    }
);

