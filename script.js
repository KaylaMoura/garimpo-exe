// Configuração do JSONBin.io para Sincronização em Tempo Real Global
const JSONBIN_BIN_ID = "6afb4f4dac6210605a8cbf82";
const JSONBIN_MASTER_KEY = "$2a$10$t.vYcZgZEhrTpIfvzQCLMu.ZRvUtyiGAcAmWjOlx8mx9CLFc.yYcC";

let produtos = [];

// Carregar produtos da nuvem (JSONBin)
async function carregarProdutosDaNuvem() {
    try {
        const resposta = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
            headers: {
                "X-Master-Key": JSONBIN_MASTER_KEY
            }
        });
        const dados = await resposta.json();
        // O JSONBin guarda os dados dentro de dados.record
        if (dados && dados.record) {
            produtos = dados.record.produtos || dados.record || [];
        }
    } catch (e) {
        console.error("Erro ao carregar produtos da nuvem:", e);
        // Fallback temporário para o localStorage se der falha de rede
        produtos = JSON.parse(localStorage.getItem('garimpo_produtos')) || [];
    }

    // Atualiza a tela dependendo de onde o script estiver rodando
    if (document.getElementById('catalogo')) {
        renderizarCatalogo(produtos);
    }
    if (document.getElementById('lista-admin')) {
        atualizarPainelAdmin();
    }
}

// Salvar produtos na nuvem (JSONBin)
async function salvarProdutosNaNuvem() {
    try {
        const resposta = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
                "X-Master-Key": JSONBIN_MASTER_KEY
            },
            body: JSON.stringify({ produtos: produtos })
        });
        if (!resposta.ok) {
            throw new Error("Erro ao salvar na nuvem");
        }
    } catch (e) {
        console.error("Erro ao salvar na nuvem:", e);
        alert("Aviso: Houve um problema ao sincronizar com a nuvem. Verifique sua conexão.");
    }
}

// 1. RENDERIZAR CATÁLOGO NO SITE PRINCIPAL
function renderizarCatalogo(lista = produtos) {
    const catalogoEl = document.getElementById('catalogo');
    const contadorEl = document.getElementById('contador-pecas');
    if (!catalogoEl) return;

    catalogoEl.innerHTML = '';
    contadorEl.innerText = `Mostrando ${lista.length} peça(s)`;

    if (lista.length === 0) {
        catalogoEl.innerHTML = `<div class="col-span-full text-center py-12 text-gray-500 font-semibold bg-white border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Nenhuma peça cadastrada no momento.</div>`;
        return;
    }

    lista.forEach(p => {
        const isReservado = p.status === 'reservado';
        const fotoExibicao = (p.fotos && p.fotos.length > 0 && p.fotos[0]) ? p.fotos[0] : 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=600&q=80';
        
        const card = document.createElement('div');
        card.className = `bg-white border-2 border-black rounded-2xl p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between transition hover:-translate-y-0.5 ${isReservado ? 'grayscale opacity-80 bg-gray-100' : ''}`;
        
        card.innerHTML = `
            <div>
                <div class="bg-gray-100 h-44 rounded-xl border border-black mb-3 overflow-hidden relative flex items-center justify-center">
                    <img src="${fotoExibicao}" alt="${p.nome}" class="w-full h-full object-cover">
                    <span class="absolute top-2 left-2 ${isReservado ? 'bg-black text-white' : 'bg-pink-400 text-black'} text-[10px] font-extrabold px-2 py-0.5 rounded border border-black">
                        ${isReservado ? 'RESERVADA 🔒' : 'TAM: ' + p.tamanho}
                    </span>
                </div>
                <h3 class="font-bold text-sm leading-snug line-clamp-1">${p.nome}</h3>
                <p class="text-xs text-gray-500 mt-0.5">${p.categoria} / ${p.subcategoria || 'Geral'}</p>
            </div>
            <div class="mt-4 flex items-center justify-between">
                <span class="font-extrabold text-base ${isReservado ? 'text-gray-700' : 'text-pink-600'}">R$ ${Number(p.preco).toFixed(2).replace('.', ',')}</span>
                <button onclick="abrirDetalhes(${p.id})" class="${isReservado ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-black text-white hover:bg-pink-600'} text-xs px-3 py-2 rounded-lg font-bold border border-black transition">
                    ${isReservado ? 'Indisponível' : 'Ver Detalhes'}
                </button>
            </div>
        `;
        catalogoEl.appendChild(card);
    });
}

// 2. FILTROS
function abrirFiltros() { document.getElementById('modal-filtros').classList.remove('hidden'); }
function fecharFiltros() { document.getElementById('modal-filtros').classList.add('hidden'); }
function aplicarFiltros() {
    const cat = document.getElementById('filtro-categoria').value;
    const tam = document.getElementById('filtro-tamanho').value;
    const stat = document.getElementById('filtro-status').value;

    let filtrados = produtos.filter(p => {
        let matchCat = cat === "" || p.categoria === cat;
        let matchTam = tam === "" || p.tamanho === tam;
        let matchStat = stat === "" || p.status === stat;
        return matchCat && matchTam && matchStat;
    });

    renderizarCatalogo(filtrados);
    fecharFiltros();
}
function limparFiltros() {
    document.getElementById('filtro-categoria').value = "";
    document.getElementById('filtro-tamanho').value = "";
    document.getElementById('filtro-status').value = "";
    renderizarCatalogo(produtos);
    fecharFiltros();
}

// 3. DETALHES E GALERIA DE FOTOS NO SITE
let produtoAtual = null;
function abrirDetalhes(id) {
    const p = produtos.find(item => item.id === id);
    if (!p || p.status === 'reservado') return;
    produtoAtual = p;

    const listaFotos = (p.fotos && p.fotos.length > 0) ? p.fotos.filter(f => f && f.trim() !== "") : ['https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=600&q=80'];
    const fotoPrincipal = listaFotos[0];

    const conteudoEl = document.getElementById('conteudo-detalhes');
    conteudoEl.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <img id="foto-principal" src="${fotoPrincipal}" class="w-full h-72 object-cover rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-3">
                <div class="flex gap-2 overflow-x-auto pb-2">
                    ${listaFotos.map(f => `<img src="${f}" onclick="trocarFoto('${f}')" class="w-16 h-16 object-cover rounded-xl border-2 border-black cursor-pointer hover:opacity-80">`).join('')}
                </div>
            </div>
            <div class="space-y-4 flex flex-col justify-between">
                <div>
                    <span class="inline-block bg-pink-300 text-black text-xs font-extrabold px-2.5 py-1 rounded-full border border-black mb-2">${p.categoria} • Tam: ${p.tamanho}</span>
                    <h2 class="text-2xl font-extrabold leading-tight">${p.nome}</h2>
                    <p class="text-2xl font-extrabold text-pink-600 mt-1">R$ ${Number(p.preco).toFixed(2).replace('.', ',')}</p>
                    
                    <div class="mt-4 space-y-2 text-xs text-gray-700 bg-gray-50 p-3 rounded-xl border border-black">
                        <p><strong>Marca:</strong> ${p.marca || 'Não informada'}</p>
                        <p><strong>Tecido:</strong> ${p.tecido || 'Não informado'}</p>
                        <p><strong>Medidas:</strong> ${p.medidas || 'Não informadas'}</p>
                        <p><strong>Avarias:</strong> ${p.avarias || 'Nenhuma'}</p>
                    </div>
                </div>

                <div class="border-t-2 border-black pt-4">
                    <button onclick="mostrarBlocoReserva()" class="w-full bg-pink-400 border-2 border-black py-3 rounded-xl font-extrabold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition flex items-center justify-center gap-2">
                        🛍️ QUERO RESERVAR ESSA PEÇA
                    </button>
                </div>
            </div>
        </div>

        <div id="bloco-reserva" class="hidden mt-6 bg-pink-50 border-2 border-black p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div class="border-b-2 border-black pb-2 flex justify-between items-center">
                <div>
                    <h4 class="font-extrabold text-sm text-black">✨ Passo a passo para garantir sua peça:</h4>
                    <p class="text-xs text-gray-600">Preencha seus dados para gerar a mensagem da DM.</p>
                </div>
                <div id="aviso-copiado" class="hidden bg-green-300 text-black border border-black text-[11px] font-extrabold px-2.5 py-1 rounded-lg">
                    ✨ Copiado!
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label class="block text-[10px] font-extrabold uppercase mb-1">Seu Nome</label>
                    <input type="text" id="input-nome" oninput="atualizarMensagemReserva()" placeholder="Ex: Maria Clara" class="w-full border-2 border-black rounded-xl p-2.5 text-xs font-semibold bg-white">
                </div>
                <div>
                    <label class="block text-[10px] font-extrabold uppercase mb-1">Seu @ do Instagram</label>
                    <input type="text" id="input-insta" oninput="atualizarMensagemReserva()" placeholder="Ex: @mariaclura" class="w-full border-2 border-black rounded-xl p-2.5 text-xs font-semibold bg-white">
                </div>
            </div>

            <div>
                <label class="block text-[10px] font-extrabold uppercase mb-1">Mensagem gerada para copiar:</label>
                <textarea id="texto-copia" readonly class="w-full h-24 border-2 border-black rounded-xl p-3 text-xs font-mono bg-white text-gray-800 resize-none shadow-inner"></textarea>
            </div>

            <div class="flex flex-col md:flex-row gap-2 pt-1">
                <button onclick="copiarMensagem()" class="w-full md:w-1/2 bg-black text-white py-3 rounded-xl font-bold text-xs border border-black hover:bg-pink-600 transition flex items-center justify-center gap-2">
                    📋 Copiar Mensagem
                </button>
                <a href="https://instagram.com/garimpo.exe" target="_blank" class="w-full md:w-1/2 bg-pink-600 text-white py-3 rounded-xl font-bold text-xs border border-black text-center flex items-center justify-center hover:bg-black transition">
                    🚀 Abrir DM do Instagram
                </a>
            </div>
        </div>
    `;

    document.getElementById('modal-detalhes').classList.remove('hidden');
}

function trocarFoto(url) {
    document.getElementById('foto-principal').src = url;
}

function fecharDetalhes() { document.getElementById('modal-detalhes').classList.add('hidden'); }
function mostrarBlocoReserva() {
    document.getElementById('bloco-reserva').classList.remove('hidden');
    atualizarMensagemReserva();
    document.getElementById('input-nome').focus();
}
function atualizarMensagemReserva() {
    if (!produtoAtual) return;
    const nome = document.getElementById('input-nome').value.trim() || "[Seu Nome]";
    const insta = document.getElementById('input-insta').value.trim() || "[Seu @]";
    const mensagem = `Oi! Quero reservar a peça: ${produtoAtual.nome} (Tam: ${produtoAtual.tamanho} - R$ ${Number(produtoAtual.preco).toFixed(2).replace('.', ',')}). Meu @ é ${insta} (${nome}). Aguardo as infos de pagamento!`;
    document.getElementById('texto-copia').value = mensagem;
}
function copiarMensagem() {
    const textarea = document.getElementById('texto-copia');
    textarea.select();
    navigator.clipboard.writeText(textarea.value).then(() => {
        const aviso = document.getElementById('aviso-copiado');
        aviso.classList.remove('hidden');
        setTimeout(() => aviso.classList.add('hidden'), 3500);
    });
}

// 4. FUNÇÕES DO PAINEL ADMIN (Com Nuvem Global)
async function comprimirEConverterImagem(fileInputId) {
    return new Promise((resolve) => {
        const fileInput = document.getElementById(fileInputId);
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            resolve(null);
            return;
        }
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            img.src = e.target.result;
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
                resolve(dataUrl);
            };
            img.onerror = function() { resolve(null); };
        };
        reader.readAsDataURL(file);
    });
}

async function salvarOuAtualizarProduto(event) {
    event.preventDefault();
    
    const editId = document.getElementById('edit-id').value;
    const foto1 = await comprimirEConverterImagem('arquivo-foto-1');
    const foto2 = await comprimirEConverterImagem('arquivo-foto-2');
    const foto3 = await comprimirEConverterImagem('arquivo-foto-3');

    const nome = document.getElementById('cad-nome').value;
    const preco = parseFloat(document.getElementById('cad-preco').value) || 0;
    const categoria = document.getElementById('cad-categoria').value;
    const subcategoria = document.getElementById('cad-sub').value;
    const tamanho = document.getElementById('cad-tamanho').value;
    const marca = document.getElementById('cad-marca').value;
    const tecido = document.getElementById('cad-tecido').value;
    const avarias = document.getElementById('cad-avarias').value;
    const medidas = document.getElementById('cad-medidas').value;

    if (editId) {
        const p = produtos.find(item => item.id == editId);
        if (p) {
            p.nome = nome;
            p.preco = preco;
            p.categoria = categoria;
            p.subcategoria = subcategoria;
            p.tamanho = tamanho;
            p.marca = marca;
            p.tecido = tecido;
            p.avarias = avarias;
            p.medidas = medidas;

            if (foto1) p.fotos[0] = foto1;
            if (foto2) p.fotos[1] = foto2;
            if (foto3) p.fotos[2] = foto3;
            p.fotos = p.fotos.filter(f => f !== null && f !== undefined);
        }
        alert("✨ Peça atualizada com sucesso!");
        cancelarEdicao();
    } else {
        const novasFotos = [foto1, foto2, foto3].filter(f => f !== null);
        const novoProduto = {
            id: Date.now(),
            nome: nome,
            preco: preco,
            categoria: categoria,
            subcategoria: subcategoria,
            tamanho: tamanho,
            fotos: novasFotos,
            marca: marca,
            tecido: tecido,
            avarias: avarias,
            medidas: medidas,
            status: "disponivel"
        };

        produtos.push(novoProduto);
        alert("✨ Peça cadastrada com sucesso!");
        document.getElementById('form-produto').reset();
    }

    // Salva na nuvem global
    await salvarProdutosNaNuvem();
    atualizarPainelAdmin();
}

function carregarParaEdicao(id) {
    const p = produtos.find(item => item.id === id);
    if (!p) return;

    document.getElementById('edit-id').value = p.id;
    document.getElementById('cad-nome').value = p.nome;
    document.getElementById('cad-preco').value = p.preco;
    document.getElementById('cad-categoria').value = p.categoria;
    document.getElementById('cad-sub').value = p.subcategoria || '';
    document.getElementById('cad-tamanho').value = p.tamanho;
    document.getElementById('cad-marca').value = p.marca || '';
    document.getElementById('cad-tecido').value = p.tecido || '';
    document.getElementById('cad-avarias').value = p.avarias || '';
    document.getElementById('cad-medidas').value = p.medidas || '';

    document.getElementById('titulo-form').innerText = "✏️ Editando Peça";
    document.getElementById('btn-submit-form').innerText = "💾 Salvar Alterações";
    document.getElementById('btn-cancelar-edicao').classList.remove('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicao() {
    document.getElementById('form-produto').reset();
    document.getElementById('edit-id').value = '';
    document.getElementById('titulo-form').innerText = "✨ Cadastrar Nova Peça";
    document.getElementById('btn-submit-form').innerText = "💾 Cadastrar Peça no Site";
    document.getElementById('btn-cancelar-edicao').classList.add('hidden');
}

function atualizarPainelAdmin() {
    const listaAdmin = document.getElementById('lista-admin');
    if (!listaAdmin) return;

    listaAdmin.innerHTML = '';

    let disp = 0;
    let res = 0;
    let totalValor = 0;

    produtos.forEach(p => {
        if (p.status === 'disponivel') {
            disp++;
            totalValor += Number(p.preco);
        } else {
            res++;
        }

        const itemDiv = document.createElement('div');
        itemDiv.className = "bg-gray-50 border-2 border-black p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3";
        itemDiv.innerHTML = `
            <div>
                <span class="bg-pink-200 text-black text-[10px] font-extrabold px-2 py-0.5 rounded border border-black">${p.categoria} • Tam: ${p.tamanho}</span>
                <h4 class="font-extrabold text-sm mt-1">${p.nome} - R$ ${Number(p.preco).toFixed(2).replace('.', ',')}</h4>
                <p class="text-xs text-gray-500">Status atual: <strong>${p.status.toUpperCase()}</strong></p>
            </div>
            <div class="flex items-center gap-2 w-full md:w-auto flex-wrap">
                <button onclick="carregarParaEdicao(${p.id})" class="bg-blue-300 border border-black px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-400 transition">
                    ✏️ Editar
                </button>
                <button onclick="alternarStatus(${p.id})" class="bg-yellow-300 border border-black px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-yellow-400 transition">
                    ${p.status === 'disponivel' ? '🔒 Reservar' : '🔓 Disponibilizar'}
                </button>
                <button onclick="excluirProduto(${p.id})" class="bg-black text-white border border-black px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-pink-600 transition">
                    🗑️ Excluir
                </button>
            </div>
        `;
        listaAdmin.appendChild(itemDiv);
    });

    const dispEl = document.getElementById('resumo-disponivel');
    const resEl = document.getElementById('resumo-reservado');
    const valEl = document.getElementById('resumo-valor');

    if (dispEl) dispEl.innerText = disp;
    if (resEl) resEl.innerText = res;
    if (valEl) valEl.innerText = `R$ ${totalValor.toFixed(2).replace('.', ',')}`;
}

async function alternarStatus(id) {
    const p = produtos.find(item => item.id === id);
    if (p) {
        p.status = p.status === 'disponivel' ? 'reservado' : 'disponivel';
        await salvarProdutosNaNuvem();
        atualizarPainelAdmin();
    }
}

async function excluirProduto(id) {
    if (confirm("Tem certeza que deseja excluir esta peça do garimpo?")) {
        produtos = produtos.filter(item => item.id !== id);
        await salvarProdutosNaNuvem();
        atualizarPainelAdmin();
    }
}

// Inicialização automática puxando da nuvem ao abrir o site ou admin
window.addEventListener('DOMContentLoaded', () => {
    carregarProdutosDaNuvem();
});
