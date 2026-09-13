const formulario = document.getElementById("formLogin");
const mensagem = document.getElementById("mensagem");

formulario.addEventListener("submit", async (evento) => {

    evento.preventDefault();

    const senha = document.getElementById("senha").value;

    mensagem.innerHTML = `
        <p style="
            margin-top:20px;
            color:#8e96a5;
        ">
            Verificando...
        </p>
    `;

    try {

        const resposta = await fetch("/api/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                senha
            })

        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.erro || "Senha incorreta."
            );
        }

        window.location.href = "admin.html";

    } catch (erro) {

        mensagem.innerHTML = `
            <div style="
                margin-top:20px;
                padding:15px;
                border-radius:8px;
                background:#2a1212;
                border:1px solid #6b2424;
                color:#ff6b6b;
            ">
                ${erro.message}
            </div>
        `;

    }

});