// ==========================================
// MENSAGEM
// ==========================================

function mostrarMensagem(texto, sucesso = true) {

    const mensagem = document.getElementById("mensagem");

    if (!mensagem) return;

    mensagem.textContent = texto;

    mensagem.style.color = sucesso
        ? "#00ff88"
        : "#ff4444";
}


// ==========================================
// ESCAPAR HTML
// ==========================================

function escaparHTML(texto) {

    if (texto === null || texto === undefined) {
        return "";
    }

    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ==========================================
// CADASTRAR REGISTRO
// ==========================================

const formCadastro =
    document.getElementById("formCadastro");

if (formCadastro) {

    formCadastro.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const nome =
                document.getElementById("nome").value.trim();

            const usuario =
                document.getElementById("usuario").value.trim();

            const descricao =
                document.getElementById("descricao").value.trim();

            const status =
                document.getElementById("status").value;

            if (!nome || !usuario || !descricao) {

                mostrarMensagem(
                    "Preencha todos os campos.",
                    false
                );

                return;
            }

            try {

                const resposta = await fetch(
                    "/api/registro",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            nome,
                            usuario,
                            descricao,
                            status
                        })
                    }
                );

                const dados = await resposta.json();

                if (!resposta.ok) {

                    throw new Error(
                        dados.erro ||
                        "Erro ao cadastrar registro."
                    );
                }

                mostrarMensagem(
                    "Registro cadastrado com sucesso!"
                );

                formCadastro.reset();

                carregarRegistros();

            } catch (erro) {

                console.error(erro);

                mostrarMensagem(
                    erro.message,
                    false
                );
            }
        }
    );
}


// ==========================================
// CARREGAR REGISTROS
// ==========================================

async function carregarRegistros() {

    const lista =
        document.getElementById("listaRegistros");

    if (!lista) return;

    try {

        const resposta =
            await fetch("/api/registros");

        if (!resposta.ok) {

            throw new Error(
                "Não foi possível carregar os registros."
            );
        }

        const registros =
            await resposta.json();

        if (
            !Array.isArray(registros) ||
            registros.length === 0
        ) {

            lista.innerHTML = `
                <p>Nenhum registro cadastrado.</p>
            `;

            return;
        }

        lista.innerHTML =
            registros.map(function (registro) {

                return `
                    <div class="registro-card">

                        <h3>
                            ${escaparHTML(registro.nome)}
                        </h3>

                        <p>
                            <strong>Usuário:</strong>
                            ${escaparHTML(registro.usuario)}
                        </p>

                        <p>
                            <strong>Descrição:</strong>
                            ${escaparHTML(registro.descricao)}
                        </p>

                        <p>
                            <strong>Status:</strong>
                            ${escaparHTML(registro.status)}
                        </p>

                        ${
                            registro.imagem
                                ? `
                                    <img
                                        src="${escaparHTML(registro.imagem)}"
                                        alt="Imagem do registro"
                                        style="
                                            max-width:300px;
                                            width:100%;
                                            border-radius:10px;
                                            margin-top:10px;
                                        "
                                    >
                                `
                                : ""
                        }

                        <div style="margin-top:15px;">

                            <button
                                onclick="editarRegistro(${registro.id})"
                            >
                                Editar
                            </button>

                            <button
                                onclick="excluirRegistro(${registro.id})"
                            >
                                Excluir
                            </button>

                        </div>

                    </div>
                `;

            }).join("");

    } catch (erro) {

        console.error(
            "Erro ao carregar registros:",
            erro
        );

        lista.innerHTML = `
            <p>
                Erro ao carregar registros.
            </p>
        `;
    }
}


// ==========================================
// CARREGAR SOLICITAÇÕES
// ==========================================

async function carregarSolicitacoes() {

    const lista =
        document.getElementById("listaSolicitacoes");

    if (!lista) return;

    try {

        const resposta =
            await fetch("/api/solicitacoes");

        if (!resposta.ok) {

            throw new Error(
                "Erro ao buscar solicitações."
            );
        }

        const solicitacoes =
            await resposta.json();

        const pendentes =
            Array.isArray(solicitacoes)
                ? solicitacoes.filter(
                    function (solicitacao) {
                        return solicitacao.status === "PENDENTE";
                    }
                )
                : [];

        if (pendentes.length === 0) {

            lista.innerHTML = `
                <p>
                    Nenhuma solicitação pendente.
                </p>
            `;

            return;
        }

        lista.innerHTML =
            pendentes.map(function (solicitacao) {

                return `
                    <div
                        class="solicitacao-card"
                        style="
                            border:1px solid #333;
                            border-radius:12px;
                            padding:20px;
                            margin-bottom:20px;
                        "
                    >

                        <div
                            style="
                                display:inline-block;
                                padding:6px 12px;
                                border-radius:20px;
                                background:#ffaa00;
                                color:#000;
                                font-weight:bold;
                                margin-bottom:15px;
                            "
                        >
                            PENDENTE
                        </div>

                        <h3>
                            ${escaparHTML(solicitacao.nome)}
                        </h3>

                        <p>
                            <strong>Usuário:</strong>
                            ${escaparHTML(solicitacao.usuario)}
                        </p>

                        <p>
                            <strong>Motivo:</strong>
                            ${escaparHTML(solicitacao.motivo)}
                        </p>

                        <p>
                            <strong>Descrição:</strong>
                            ${escaparHTML(
                                solicitacao.descricao || ""
                            )}
                        </p>

                        ${
                            solicitacao.imagem
                                ? `
                                    <div style="margin-top:15px;">

                                        <p>
                                            <strong>
                                                Prova enviada:
                                            </strong>
                                        </p>

                                        <img
                                            src="${escaparHTML(solicitacao.imagem)}"
                                            alt="Prova enviada"
                                            style="
                                                max-width:500px;
                                                width:100%;
                                                border-radius:10px;
                                                display:block;
                                            "
                                        >

                                    </div>
                                `
                                : `
                                    <p>
                                        Nenhuma imagem enviada.
                                    </p>
                                `
                        }

                        <p>
                            <strong>ID:</strong>
                            ${escaparHTML(solicitacao.id)}
                        </p>

                        <div
                            style="
                                display:flex;
                                gap:10px;
                                margin-top:20px;
                            "
                        >

                            <button
                                onclick="aprovarSolicitacao(${solicitacao.id})"
                            >
                                ✓ Aprovar
                            </button>

                            <button
                                onclick="recusarSolicitacao(${solicitacao.id})"
                            >
                                ✕ Recusar
                            </button>

                        </div>

                    </div>
                `;

            }).join("");

    } catch (erro) {

        console.error(
            "Erro ao carregar solicitações:",
            erro
        );

        lista.innerHTML = `
            <p>
                Erro ao carregar solicitações.
            </p>
        `;
    }
}


// ==========================================
// APROVAR SOLICITAÇÃO
// ==========================================

async function aprovarSolicitacao(id) {

    const confirmar =
        confirm(
            "Deseja realmente APROVAR esta solicitação?"
        );

    if (!confirmar) return;

    try {

        const resposta =
            await fetch(
                `/api/solicitacao/${id}/aprovar`,
                {
                    method: "POST"
                }
            );

        const dados =
            await resposta.json();

        if (!resposta.ok) {

            throw new Error(
                dados.erro ||
                "Erro ao aprovar solicitação."
            );
        }

        alert(
            "Solicitação aprovada com sucesso!"
        );

        carregarSolicitacoes();

        carregarRegistros();

    } catch (erro) {

        console.error(erro);

        alert(
            erro.message
        );
    }
}


// ==========================================
// RECUSAR SOLICITAÇÃO
// ==========================================

async function recusarSolicitacao(id) {

    const confirmar =
        confirm(
            "Deseja realmente RECUSAR esta solicitação?"
        );

    if (!confirmar) return;

    try {

        const resposta =
            await fetch(
                `/api/solicitacao/${id}/recusar`,
                {
                    method: "POST"
                }
            );

        const dados =
            await resposta.json();

        if (!resposta.ok) {

            throw new Error(
                dados.erro ||
                "Erro ao recusar solicitação."
            );
        }

        alert(
            "Solicitação recusada."
        );

        carregarSolicitacoes();

    } catch (erro) {

        console.error(erro);

        alert(
            erro.message
        );
    }
}


// ==========================================
// EDITAR REGISTRO
// ==========================================

async function editarRegistro(id) {

    const novoNome =
        prompt("Novo nome:");

    if (novoNome === null) return;

    const novoUsuario =
        prompt("Novo usuário:");

    if (novoUsuario === null) return;

    const novaDescricao =
        prompt("Nova descrição:");

    if (novaDescricao === null) return;

    const novoStatus =
        prompt(
            "Novo status:",
            "APROVADO"
        );

    if (novoStatus === null) return;

    try {

        const resposta =
            await fetch(
                `/api/registro/${id}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        nome: novoNome,
                        usuario: novoUsuario,
                        descricao: novaDescricao,
                        status: novoStatus
                    })
                }
            );

        const dados =
            await resposta.json();

        if (!resposta.ok) {

            throw new Error(
                dados.erro ||
                "Erro ao editar registro."
            );
        }

        alert(
            "Registro atualizado!"
        );

        carregarRegistros();

    } catch (erro) {

        console.error(erro);

        alert(
            erro.message
        );
    }
}


// ==========================================
// EXCLUIR REGISTRO
// ==========================================

async function excluirRegistro(id) {

    const confirmar =
        confirm(
            "Deseja realmente excluir este registro?"
        );

    if (!confirmar) return;

    try {

        const resposta =
            await fetch(
                `/api/registro/${id}`,
                {
                    method: "DELETE"
                }
            );

        const dados =
            await resposta.json();

        if (!resposta.ok) {

            throw new Error(
                dados.erro ||
                "Erro ao excluir registro."
            );
        }

        alert(
            "Registro excluído!"
        );

        carregarRegistros();

    } catch (erro) {

        console.error(erro);

        alert(
            erro.message
        );
    }
}


// ==========================================
// LOGOUT
// ==========================================

async function logout() {

    try {

        await fetch(
            "/api/logout",
            {
                method: "POST"
            }
        );

    } catch (erro) {

        console.error(erro);
    }

    window.location.href =
        "/login.html";
}


// ==========================================
// INICIAR PAINEL
// ==========================================

carregarRegistros();

carregarSolicitacoes();