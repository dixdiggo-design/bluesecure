
async function pesquisar() {

    const campo = document.getElementById("campoPesquisa");
    const resultado = document.getElementById("resultado");

    const pesquisa = campo.value.trim();

    if (!pesquisa) {

        resultado.innerHTML = `
            <p style="margin-top:20px;color:#ff6b6b;">
                Digite algo para pesquisar.
            </p>
        `;

        return;
    }

    resultado.innerHTML = `
        <p style="margin-top:20px;color:#8e96a5;">
            Pesquisando...
        </p>
    `;

    try {

        const resposta = await fetch(
            `/api/pesquisar?termo=${encodeURIComponent(pesquisa)}`
        );

        const texto = await resposta.text();

        let registros;

        try {
            registros = JSON.parse(texto);
        } catch (erroJSON) {

            console.error(
                "Servidor não retornou JSON:",
                texto
            );

            throw new Error(
                "O servidor retornou uma resposta inválida."
            );
        }

        if (!resposta.ok) {

            throw new Error(
                registros.erro ||
                "Não foi possível realizar a pesquisa."
            );
        }

        if (!Array.isArray(registros)) {

            throw new Error(
                "Resposta inválida do servidor."
            );
        }

        if (registros.length === 0) {

            resultado.innerHTML = `
                <div style="
                    margin-top:25px;
                    padding:20px;
                    background:#0d1016;
                    border:1px solid #202631;
                    border-radius:10px;
                ">

                    <strong>
                        Nenhum resultado encontrado
                    </strong>

                    <p style="
                        margin-top:8px;
                        color:#8e96a5;
                    ">
                        Não encontramos registros para essa pesquisa.
                    </p>

                </div>
            `;

            return;
        }

        resultado.innerHTML = registros.map(registro => `

            <div
                class="resultado-card"
                onclick="abrirDetalhes(${Number(registro.id)})"
                style="cursor:pointer;"
            >

                <div class="resultado-topo">

                    <div>

                        <div class="resultado-nome">
                            ${escaparHTML(registro.nome)}
                        </div>

                        <div class="resultado-usuario">
                            @${escaparHTML(registro.usuario)}
                        </div>

                    </div>

                    <div class="resultado-status">
                        ${escaparHTML(registro.status)}
                    </div>

                </div>

                <div class="resultado-descricao">
                    ${escaparHTML(registro.descricao)}
                </div>

                <div style="
                    margin-top:15px;
                    color:#4d8dff;
                    font-size:13px;
                ">
                    Clique para ver detalhes →
                </div>

            </div>

        `).join("");

    } catch (erro) {

        console.error(
            "ERRO AO PESQUISAR:",
            erro
        );

        resultado.innerHTML = `
            <p style="
                margin-top:20px;
                color:#ff6b6b;
            ">
                ${escaparHTML(erro.message)}
            </p>
        `;
    }
}


// ==========================================
// ABRIR DETALHES
// ==========================================

function abrirDetalhes(id) {

    window.location.href =
        `detalhes.html?id=${encodeURIComponent(id)}`;

}


// ==========================================
// ESCAPAR HTML
// ==========================================

function escaparHTML(texto) {

    const div =
        document.createElement("div");

    div.textContent =
        texto ?? "";

    return div.innerHTML;
}


// ==========================================
// ENVIAR SOLICITAÇÃO DE PROVA
// ==========================================

async function enviarSolicitacao(event) {

    event.preventDefault();

    const formulario =
        document.getElementById("formSolicitacao");

    const mensagem =
        document.getElementById("mensagemSolicitacao");

    const nome =
        document
            .getElementById("solicitacaoNome")
            .value
            .trim();

    const usuario =
        document
            .getElementById("solicitacaoUsuario")
            .value
            .trim();

    const motivo =
        document
            .getElementById("solicitacaoMotivo")
            .value
            .trim();

    const descricao =
        document
            .getElementById("solicitacaoDescricao")
            .value
            .trim();

    const campoImagem =
        document.getElementById("solicitacaoImagem");

    const imagem =
        campoImagem.files[0];


    // ==========================================
    // VALIDAÇÕES
    // ==========================================

    if (!nome || !usuario || !motivo) {

        mensagem.innerHTML = `
            <div style="
                margin-top:15px;
                padding:14px;
                border-radius:8px;
                background:#2a1515;
                border:1px solid #5a2525;
                color:#ff6b6b;
            ">
                Preencha todos os campos obrigatórios.
            </div>
        `;

        return;
    }


    if (!imagem) {

        mensagem.innerHTML = `
            <div style="
                margin-top:15px;
                padding:14px;
                border-radius:8px;
                background:#2a1515;
                border:1px solid #5a2525;
                color:#ff6b6b;
            ">
                Envie uma imagem como prova.
            </div>
        `;

        return;
    }


    if (imagem.size > 5 * 1024 * 1024) {

        mensagem.innerHTML = `
            <div style="
                margin-top:15px;
                padding:14px;
                border-radius:8px;
                background:#2a1515;
                border:1px solid #5a2525;
                color:#ff6b6b;
            ">
                A imagem não pode ter mais de 5 MB.
            </div>
        `;

        return;
    }


    mensagem.innerHTML = `
        <div style="
            margin-top:15px;
            padding:14px;
            border-radius:8px;
            background:#111827;
            border:1px solid #263248;
            color:#8e96a5;
        ">
            Enviando sua solicitação...
        </div>
    `;


    // ==========================================
    // FORM DATA
    // ==========================================

    const dados =
        new FormData();

    dados.append(
        "nome",
        nome
    );

    dados.append(
        "usuario",
        usuario
    );

    dados.append(
        "motivo",
        motivo
    );

    dados.append(
        "descricao",
        descricao
    );

    dados.append(
        "imagem",
        imagem
    );


    // ==========================================
    // ENVIO
    // ==========================================

    try {

        const resposta =
            await fetch(
                "/api/solicitacao",
                {
                    method: "POST",
                    body: dados
                }
            );


        // IMPORTANTE:
        // Primeiro lê como texto.
        // Assim nunca teremos:
        // Unexpected token '<'

        const texto =
            await resposta.text();


        let resultado;

        try {

            resultado =
                JSON.parse(texto);

        } catch (erroJSON) {

            console.error(
                "RESPOSTA BRUTA DO SERVIDOR:",
                texto
            );

            throw new Error(
                "O servidor retornou uma resposta inválida."
            );
        }


        if (!resposta.ok) {

            throw new Error(
                resultado.erro ||
                "Não foi possível enviar a solicitação."
            );
        }


        mensagem.innerHTML = `
            <div style="
                margin-top:15px;
                padding:18px;
                border-radius:8px;
                background:#102419;
                border:1px solid #245b36;
                color:#65d98b;
            ">

                <strong>
                    Solicitação enviada com sucesso!
                </strong>

                <p style="
                    margin-top:8px;
                    color:#9bb5a4;
                ">
                    Sua prova foi enviada para análise.
                    Ela ficará privada até que um administrador
                    decida se o registro será publicado.
                </p>

            </div>
        `;


        formulario.reset();


    } catch (erro) {

        console.error(
            "ERRO AO ENVIAR SOLICITAÇÃO:",
            erro
        );

        mensagem.innerHTML = `
            <div style="
                margin-top:15px;
                padding:14px;
                border-radius:8px;
                background:#2a1515;
                border:1px solid #5a2525;
                color:#ff6b6b;
            ">
                ${escaparHTML(erro.message)}
            </div>
        `;
    }
}

