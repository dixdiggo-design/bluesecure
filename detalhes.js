const detalhes =
    document.getElementById("detalhesRegistro");


// ==========================================
// PEGAR ID DA URL
// ==========================================

const parametros =
    new URLSearchParams(
        window.location.search
    );

const id =
    parametros.get("id");


// ==========================================
// BUSCAR REGISTRO
// ==========================================

async function carregarDetalhes() {

    if (!id) {

        detalhes.innerHTML = `
            <div
                class="resultado-card"
                style="text-align:center;"
            >
                <p style="color:#ff6b6b;">
                    Registro não especificado.
                </p>
            </div>
        `;

        return;
    }


    try {

        const resposta =
            await fetch(
                `/api/registro/${id}`
            );


        const registro =
            await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                registro.erro ||
                "Registro não encontrado."
            );

        }


        detalhes.innerHTML = `

            <div class="resultado-card">

                <div class="resultado-topo">

                    <div>

                        <div class="resultado-nome">
                            ${registro.nome}
                        </div>

                        <div class="resultado-usuario">
                            @${registro.usuario}
                        </div>

                    </div>

                    <div class="resultado-status">
                        ${registro.status}
                    </div>

                </div>


                <div
                    class="resultado-descricao"
                    style="margin-top:25px;"
                >
                    ${registro.descricao}
                </div>


                <div style="
                    margin-top:25px;
                    padding-top:20px;
                    border-top:1px solid #202632;
                    color:#8e96a5;
                    font-size:14px;
                ">

                    ID do registro:

                    <strong style="
                        color:#ffffff;
                    ">
                        #${registro.id}
                    </strong>

                </div>

            </div>

        `;


    } catch (erro) {

        console.error(erro);


        detalhes.innerHTML = `
            <div
                class="resultado-card"
                style="
                    text-align:center;
                    border-color:#6b2424;
                "
            >

                <p style="color:#ff6b6b;">
                    ${erro.message}
                </p>

            </div>
        `;

    }

}


// ==========================================
// INICIAR
// ==========================================

carregarDetalhes();