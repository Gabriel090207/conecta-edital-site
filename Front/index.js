document.addEventListener("DOMContentLoaded", () => {
    // URL do seu backend FastAPI
    const BACKEND_URL = "https://conecta-edital-site.onrender.com";;

    // 1. Funcionalidade do Acordeão (FAQ)
    const faqItems = document.querySelectorAll(".faq-item");

    faqItems.forEach(item => {
        const question = item.querySelector(".faq-question");
        const answer = item.querySelector(".faq-answer");

        question.addEventListener("click", () => {
            const isActive = item.classList.contains("active");

            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains("active")) {
                    otherItem.classList.remove("active");
                    const otherAnswer = otherItem.querySelector(".faq-answer");
                    if (otherAnswer) {
                        otherAnswer.style.maxHeight = "0px";
                        otherAnswer.style.paddingTop = "0px";
                        otherAnswer.style.paddingBottom = "0px";
                    }
                }
            });

            if (isActive) {
                item.classList.remove("active");
                if (answer) {
                    answer.style.maxHeight = "0px";
                    answer.style.paddingTop = "0px";
                    answer.style.paddingBottom = "0px";
                }
            } else {
                item.classList.add("active");
                if (answer) {
                    answer.style.maxHeight = (answer.scrollHeight + 10 + 20) + "px";
                    answer.style.paddingTop = "10px";
                    answer.style.paddingBottom = "20px";
                }
            }
        });
    });

    document.addEventListener("click", (event) => {
        const faqAccordionContainer = document.querySelector(".faq-accordion");
        if (faqAccordionContainer && !faqAccordionContainer.contains(event.target)) {
            faqItems.forEach(item => {
                item.classList.remove("active");
                const answer = item.querySelector(".faq-answer");
                if (answer) {
                    answer.style.maxHeight = "0px";
                    answer.style.paddingTop = "0px";
                    answer.style.paddingBottom = "0px";
                }
            });
        }
    });

    // 2. Scroll Suave para links da Navbar
    document.querySelectorAll('.navbar-center-index a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const navbarHeight = document.querySelector('.navbar-index').offsetHeight;
                const offsetTop = targetElement.offsetTop - navbarHeight - 20;

                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ===============================================
    // Lógica da Demonstração de Monitoramento (Seção "Precisão")
    // ===============================================
    const uploadBox = document.querySelector('.upload-box');
    const pdfFileInput = document.createElement('input');
    pdfFileInput.type = 'file';
    pdfFileInput.accept = 'application/pdf';
    pdfFileInput.style.display = 'none';

    // Referências do formulário de demonstração
    const keywordInput = document.querySelector('#testar input[type="text"]');
    const emailInput = document.querySelector('#testar input[type="email"]');
    const analisarIaBtn = document.querySelector('.btn-analisar-ia');
    const formDemonstracao = document.querySelector('.upload-form-card');

    let pdfFile = null;

    // Abrir o seletor de arquivos ao clicar na caixa de upload
    if (uploadBox) {
        uploadBox.addEventListener('click', () => {
            pdfFileInput.click();
        });
    }

    // Lidar com a seleção do arquivo PDF
    pdfFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            pdfFile = file;
            uploadBox.innerHTML = `<i class="fas fa-file-pdf"></i><p class="upload-text">${file.name}</p>`;
        } else {
            alert('Por favor, selecione um arquivo PDF válido.');
            pdfFile = null;
            uploadBox.innerHTML = `<i class="fas fa-cloud-upload-alt"></i><p class="upload-text">Clique aqui ou arraste seu PDF</p><small>Tamanho máximo: 5MB - Apenas arquivos PDF</small>`;
        }
    });

    // Enviar dados para o backend ao clicar no botão
    if (analisarIaBtn) {
        analisarIaBtn.addEventListener('click', async () => {
            const keyword = keywordInput.value.trim();
            const email = emailInput.value.trim();

            if (!pdfFile || !keyword || !email) {
                alert('Por favor, anexe um PDF e preencha todos os campos.');
                return;
            }

            analisarIaBtn.disabled = true;
            analisarIaBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analisando...';

            const formData = new FormData();
            formData.append('pdf_file', pdfFile);
            formData.append('keyword', keyword);
            formData.append('email', email);

            try {
                const response = await fetch(`${BACKEND_URL}/api/test-monitoring`, {
                    method: 'POST',
                    body: formData,
                });
                
                const result = await response.json();

                if (response.ok) {
                    alert('Análise concluída! ' + result.message);
                } else {
                    alert('Erro na análise: ' + (result.detail || 'Ocorreu um erro inesperado.'));
                }
            } catch (error) {
                console.error('Erro na requisição:', error);
                alert('Ocorreu um erro ao se conectar com o servidor. Verifique o backend.');
            } finally {
                analisarIaBtn.disabled = false;
                analisarIaBtn.innerHTML = '<i class="fas fa-bolt"></i> Analisar com IA Agora';
            }
        });
    }


    // ===============================================
    // Lógica da Demonstração de Animação
    // ===============================================
    const startDemoBtn = document.getElementById('start-demo-btn');
    const demoStates = document.querySelectorAll('.demo-state');
    let currentStateIndex = 0;
    let demoInterval;

    function showState(index) {
        demoStates.forEach((state, i) => {
            if (i === index) {
                state.classList.add('active-state');
            } else {
                state.classList.remove('active-state');
            }
        });
    }

    function startDemo() {
        currentStateIndex = 0;
        showState(currentStateIndex);

        if (demoInterval) {
            clearInterval(demoInterval);
        }

        demoInterval = setInterval(() => {
            currentStateIndex++;
            if (currentStateIndex < demoStates.length) {
                showState(currentStateIndex);
            } else {
                clearInterval(demoInterval);
                setTimeout(() => {
                    startDemo();
                }, 3000);
            }
        }, 1500);
    }

    if (startDemoBtn) {
        startDemoBtn.addEventListener('click', startDemo);
    }
    
    // Iniciar a demonstração automaticamente ao carregar a página
    startDemo();
});