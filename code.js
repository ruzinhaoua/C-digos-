class Jogador {
    constructor(nome, nivel = 1) {
        this.nome = nome;
        this.nivel = nivel;
        this.vida = 100;
        this.vitorias = 0;
        this.derrotas = 0;
        this.perguntasAcertadas = 0;
        this.perguntasErradas = 0;
    }

    tomarDano(dano) {
        this.vida = Math.max(0, this.vida - dano);
        return this.vida;
    }

    curar(cura) {
        this.vida = Math.min(100, this.vida + cura);
        return this.vida;
    }

    acertarPergunta() {
        this.perguntasAcertadas++;
    }

    errarPergunta() {
        this.perguntasErradas++;
    }

    vencerBatalha() {
        this.vitorias++;
        this.nivel++;
        this.vida = 100;
    }

    perderBatalha() {
        this.derrotas++;
        this.vida = 100;
    }

    toJSON() {
        return {
            nome: this.nome,
            nivel: this.nivel,
            vida: this.vida,
            vitorias: this.vitorias,
            derrotas: this.derrotas,
            perguntasAcertadas: this.perguntasAcertadas,
            perguntasErradas: this.perguntasErradas
        };
    }
}

class Pergunta {
    constructor(enunciado, alternativas, respostaCorreta, dificuldade) {
        this.enunciado = enunciado;
        this.alternativas = alternativas;
        this.respostaCorreta = respostaCorreta;
        this.dificuldade = dificuldade;
    }
}

class QuizBattle {
    constructor() {
        this.jogadores = [];
        this.perguntas = [];
        this.torneioAtivo = false;
        this.participantesTorneio = [];
        this.rodadaAtual = 0;
        this.jogadorAtual = null;
        this.adversarioAtual = null;
        this.turnoPulado = false;
        this.perguntasUsadas = new Set();
        this.carregarDados();
        this.carregarPerguntas();
        this.configurarEventos();
        this.atualizarTotalJogadores();
    }

    carregarDados() {
        const dados = localStorage.getItem('quizBattleData');
        if (dados) {
            const parsed = JSON.parse(dados);
            this.jogadores = parsed.jogadores.map(j => {
                const jogador = new Jogador(j.nome, j.nivel);
                Object.assign(jogador, j);
                return jogador;
            });
        }
    }

    salvarDados() {
        const dados = {
            jogadores: this.jogadores.map(j => j.toJSON())
        };
        localStorage.setItem('quizBattleData', JSON.stringify(dados));
    }

    async carregarPerguntas() {
        try {
            const response = await fetch('perguntas.json');
            const perguntasData = await response.json();
            this.perguntas = perguntasData.map(p => new Pergunta(
                p.enunciado,
                p.alternativas,
                p.respostaCorreta,
                p.dificuldade
            ));
        } catch (error) {
            console.error('Erro ao carregar perguntas:', error);
            // Perguntas de fallback
            this.perguntas = [
                new Pergunta("Qual organela produz ATP?", ["a) Núcleo", "b) Mitocôndria", "c) Ribossomo", "d) Lisossomo"], "b", 1),
                new Pergunta("O que a carioteca envolve?", ["a) Citoplasma", "b) Núcleo", "c) Mitocôndria", "d) Ribossomos"], "b", 2)
            ];
        }
    }

    configurarEventos() {
        // Tela Inicial
        document.getElementById('btn-iniciar-jogo').addEventListener('click', () => {
            this.mostrarTela('menu-principal');
        });
        
        document.getElementById('btn-treinar').addEventListener('click', () => {
            this.mostrarTela('tela-treino');
        });
        
        document.getElementById('btn-ranking').addEventListener('click', () => {
            this.mostrarRanking();
            this.mostrarTela('tela-ranking');
        });

        // Menu Principal
        document.getElementById('btn-cadastrar').addEventListener('click', () => {
            this.mostrarTela('tela-cadastro');
        });

        document.getElementById('btn-iniciar-torneio').addEventListener('click', () => {
            if (this.jogadores.length < 2) {
                alert('É necessário pelo menos 2 jogadores para iniciar um torneio!');
                return;
            }
            this.iniciarTorneio();
        });

        document.getElementById('btn-voltar-menu').addEventListener('click', () => {
            this.mostrarTela('tela-inicial');
        });

        // Tela de Cadastro
        document.getElementById('btn-confirmar-cadastro').addEventListener('click', () => {
            const nome = document.getElementById('nome-jogador').value.trim();
            if (!nome) {
                alert('Por favor, digite um nome válido!');
                return;
            }
            
            if (this.jogadores.some(j => j.nome.toLowerCase() === nome.toLowerCase())) {
                alert('Já existe um jogador com esse nome!');
                return;
            }
            
            this.jogadores.push(new Jogador(nome));
            this.salvarDados();
            this.atualizarTotalJogadores();
            document.getElementById('nome-jogador').value = '';
            alert(`Jogador ${nome} cadastrado com sucesso!`);
            this.mostrarTela('menu-principal');
        });

        document.getElementById('btn-voltar-cadastro').addEventListener('click', () => {
            this.mostrarTela('menu-principal');
        });

        // Tela de Ranking
        document.getElementById('btn-voltar-ranking').addEventListener('click', () => {
            this.mostrarTela('tela-inicial');
        });

        // Tela de Torneio
        document.getElementById('btn-voltar-torneio').addEventListener('click', () => {
            this.torneioAtivo = false;
            this.mostrarTela('menu-principal');
        });

        // Tela de Batalha
        document.getElementById('btn-iniciar-batalha').addEventListener('click', () => {
            this.iniciarBatalha();
        });

        document.getElementById('btn-pular-vez').addEventListener('click', () => {
            this.turnoPulado = true;
            this.proximoTurno();
        });

        // Tela de Resultado
        document.getElementById('btn-continuar-torneio').addEventListener('click', () => {
            this.continuarTorneio();
        });

        document.getElementById('btn-voltar-menu-final').addEventListener('click', () => {
            this.mostrarTela('tela-inicial');
        });

        // Tela de Treino
        document.getElementById('btn-voltar-treino').addEventListener('click', () => {
            this.mostrarTela('tela-inicial');
        });

        // Configurar eventos dos cards de PDF
        document.querySelectorAll('.material-card').forEach(card => {
            card.addEventListener('click', () => {
                const pdf = card.getAttribute('data-pdf');
                this.abrirPDF(pdf);
            });
        });
    }

    mostrarTela(idTela) {
        document.querySelectorAll('.screen').forEach(tela => {
            tela.classList.remove('active');
        });
        document.getElementById(idTela).classList.add('active');
    }

    atualizarTotalJogadores() {
        document.getElementById('total-jogadores').textContent = this.jogadores.length;
        const campeao = this.jogadores.length > 0 
            ? [...this.jogadores].sort((a, b) => b.vitorias - a.vitorias)[0] 
            : null;
        document.getElementById('campeao-atual').textContent = campeao 
            ? `${campeao.nome} (${campeao.vitorias} vitórias)` 
            : 'Nenhum';
    }

    mostrarRanking() {
        const tbody = document.querySelector('#tabela-ranking tbody');
        tbody.innerHTML = '';
        
        if (this.jogadores.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhum jogador cadastrado</td></tr>';
            return;
        }
        
        [...this.jogadores]
            .sort((a, b) => b.vitorias - a.vitorias || b.perguntasAcertadas - a.perguntasAcertadas || a.derrotas - b.derrotas)
            .forEach((jogador, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${jogador.nome}</td>
                    <td>${jogador.vitorias}</td>
                    <td>${jogador.derrotas}</td>
                    <td>${jogador.perguntasAcertadas}</td>
                    <td>${jogador.nivel}</td>
                    <td><button class="btn-excluir" data-nome="${jogador.nome}">🗑️ Excluir</button></td>
                `;
                tbody.appendChild(tr);
            });

        document.querySelectorAll('.btn-excluir').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const nomeJogador = e.target.dataset.nome;
                if (confirm(`Tem certeza que deseja excluir permanentemente ${nomeJogador}?`)) {
                    this.excluirJogador(nomeJogador);
                }
            });
        });
    }

    excluirJogador(nomeJogador) {
        if (this.torneioAtivo && this.participantesTorneio.some(j => j.nome.toLowerCase() === nomeJogador.toLowerCase())) {
            alert('Não é possível excluir jogadores participantes de um torneio em andamento!');
            return false;
        }
        
        const inicialCount = this.jogadores.length;
        this.jogadores = this.jogadores.filter(j => 
            j.nome.toLowerCase() !== nomeJogador.toLowerCase()
        );
        
        if (this.jogadores.length === inicialCount) {
            alert('Jogador não encontrado!');
            return false;
        }
        
        this.salvarDados();
        this.mostrarRanking();
        this.atualizarTotalJogadores();
        return true;
    }

    iniciarTorneio() {
        this.torneioAtivo = true;
        this.participantesTorneio = [...this.jogadores];
        this.embaralharArray(this.participantesTorneio);
        this.rodadaAtual = 1;
        this.perguntasUsadas.clear();
        
        this.mostrarTela('tela-torneio');
        this.atualizarInfoTorneio();
        this.mostrarProximaBatalha();
    }

    embaralharArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    atualizarInfoTorneio() {
        document.getElementById('rodada-atual').textContent = this.rodadaAtual;
        document.getElementById('jogadores-restantes').textContent = this.participantesTorneio.length;
    }

    mostrarProximaBatalha() {
        const container = document.getElementById('batalha-container');
        
        if (this.participantesTorneio.length === 1) {
            this.mostrarCampeao();
            return;
        }
        
        if (this.participantesTorneio.length % 2 !== 0) {
            const jogadorBye = this.participantesTorneio.pop();
            container.innerHTML = `
                <div class="bye-message">
                    <h3>${jogadorBye.nome} avança automaticamente para a próxima rodada</h3>
                </div>
                <button id="btn-proxima-batalha" class="btn-action">Continuar</button>
            `;
            
            document.getElementById('btn-proxima-batalha').addEventListener('click', () => {
                this.rodadaAtual++;
                this.atualizarInfoTorneio();
                this.mostrarProximaBatalha();
            });
            return;
        }
        
        const jogador1 = this.participantesTorneio.shift();
        const jogador2 = this.participantesTorneio.shift();
        
        container.innerHTML = `
            <div class="battle-preview">
                <h3>Próxima Batalha</h3>
                <div class="players-preview">
                    <div class="player-preview">
                        <h4>${jogador1.nome}</h4>
                        <p>Nível: ${jogador1.nivel}</p>
                        <p>Vitórias: ${jogador1.vitorias}</p>
                    </div>
                    <div class="vs">VS</div>
                    <div class="player-preview">
                        <h4>${jogador2.nome}</h4>
                        <p>Nível: ${jogador2.nivel}</p>
                        <p>Vitórias: ${jogador2.vitorias}</p>
                    </div>
                </div>
            </div>
            <button id="btn-iniciar-batalha-torneio" class="btn-action">Iniciar Batalha</button>
        `;
        
        document.getElementById('btn-iniciar-batalha-torneio').addEventListener('click', () => {
            this.jogadorAtual = jogador1;
            this.adversarioAtual = jogador2;
            this.prepararBatalha();
            this.mostrarTela('tela-batalha');
        });
    }

    prepararBatalha() {
        this.turnoPulado = false;
        document.getElementById('titulo-batalha').textContent = `${this.jogadorAtual.nome} vs ${this.adversarioAtual.nome}`;
        document.getElementById('nome-jogador1').textContent = this.jogadorAtual.nome;
        document.getElementById('nome-jogador2').textContent = this.adversarioAtual.nome;
        
        this.atualizarBarrasDeVida();
        
        document.getElementById('texto-pergunta').textContent = 'Preparado para a batalha?';
        document.getElementById('alternativas-container').innerHTML = '';
        
        document.getElementById('btn-iniciar-batalha').disabled = false;
        document.getElementById('btn-pular-vez').disabled = true;
    }

    iniciarBatalha() {
        document.getElementById('btn-iniciar-batalha').disabled = true;
        this.fazerPergunta(this.jogadorAtual);
    }

    selecionarPergunta(dificuldade) {
        const perguntasDisponiveis = this.perguntas.filter(p => 
            p.dificuldade === dificuldade && !this.perguntasUsadas.has(p.enunciado)
        );

        if (perguntasDisponiveis.length === 0) {
            // Reseta as perguntas se acabarem
            this.perguntasUsadas.clear();
            return this.selecionarPergunta(dificuldade);
        }

        const pergunta = perguntasDisponiveis[
            Math.floor(Math.random() * perguntasDisponiveis.length)
        ];
        this.perguntasUsadas.add(pergunta.enunciado);
        return pergunta;
    }

    fazerPergunta(jogador) {
        const dificuldade = Math.min(3, jogador.nivel);
        const pergunta = this.selecionarPergunta(dificuldade);
        
        document.getElementById('texto-pergunta').innerHTML = `
            <strong>Vez de: ${jogador.nome}</strong><br>
            ${pergunta.enunciado}
        `;
        
        const alternativasContainer = document.getElementById('alternativas-container');
        alternativasContainer.innerHTML = '';
        
        pergunta.alternativas.forEach(alt => {
            const letra = alt.substring(0, 1);
            const btn = document.createElement('button');
            btn.className = 'alternativa-btn';
            btn.textContent = alt;
            btn.dataset.letra = letra;
            btn.addEventListener('click', () => this.verificarResposta(btn, pergunta.respostaCorreta, jogador));
            alternativasContainer.appendChild(btn);
        });
        
        document.getElementById('btn-pular-vez').disabled = false;
    }

    verificarResposta(botao, respostaCorreta, jogadorAtual) {
        const letraSelecionada = botao.dataset.letra;
        const adversario = jogadorAtual === this.jogadorAtual ? this.adversarioAtual : this.jogadorAtual;
        
        document.querySelectorAll('.alternativa-btn').forEach(btn => {
            btn.disabled = true;
            if (btn.dataset.letra === respostaCorreta) {
                btn.classList.add('correct');
            } else if (btn === botao && letraSelecionada !== respostaCorreta) {
                btn.classList.add('incorrect');
            }
        });
        
        document.getElementById('btn-pular-vez').disabled = true;
        
        if (letraSelecionada === respostaCorreta) {
            adversario.tomarDano(20);
            jogadorAtual.acertarPergunta();
            
            setTimeout(() => {
                alert(`Resposta correta! ${jogadorAtual.nome} causa 20 de dano em ${adversario.nome}!`);
                this.atualizarBarrasDeVida();
                
                if (adversario.vida <= 0) {
                    this.finalizarBatalha(jogadorAtual, adversario);
                } else {
                    setTimeout(() => this.proximoTurno(), 1000);
                }
            }, 1000);
        } else {
            jogadorAtual.tomarDano(10);
            jogadorAtual.errarPergunta();
            
            setTimeout(() => {
                alert(`Resposta errada! A correta era ${respostaCorreta}. ${jogadorAtual.nome} toma 10 de dano!`);
                this.atualizarBarrasDeVida();
                
                if (jogadorAtual.vida <= 0) {
                    this.finalizarBatalha(adversario, jogadorAtual);
                } else {
                    setTimeout(() => this.proximoTurno(), 1000);
                }
            }, 1000);
        }
    }

    atualizarBarrasDeVida() {
        document.getElementById('barra-vida-jogador1').style.width = `${this.jogadorAtual.vida}%`;
        document.getElementById('vida-jogador1').textContent = `${this.jogadorAtual.vida} HP`;
        
        document.getElementById('barra-vida-jogador2').style.width = `${this.adversarioAtual.vida}%`;
        document.getElementById('vida-jogador2').textContent = `${this.adversarioAtual.vida} HP`;
        
        const atualizarCorBarra = (elemento, vida) => {
            elemento.style.backgroundColor = vida < 30 ? 'var(--danger-color)' : 
                                           vida < 60 ? 'var(--warning-color)' : 
                                           'var(--success-color)';
        };
        
        atualizarCorBarra(document.getElementById('barra-vida-jogador1'), this.jogadorAtual.vida);
        atualizarCorBarra(document.getElementById('barra-vida-jogador2'), this.adversarioAtual.vida);
    }

    proximoTurno() {
        if (this.turnoPulado) {
            alert(`${this.jogadorAtual.nome} pulou a vez!`);
            this.turnoPulado = false;
        }
        
        if (this.jogadorAtual.vida > 0 && this.adversarioAtual.vida > 0) {
            [this.jogadorAtual, this.adversarioAtual] = [this.adversarioAtual, this.jogadorAtual];
            this.fazerPergunta(this.jogadorAtual);
        }
    }

    finalizarBatalha(vencedor, perdedor) {
        vencedor.vencerBatalha();
        perdedor.perderBatalha();
        this.salvarDados();
        
        document.getElementById('titulo-resultado').textContent = 'Batalha Concluída';
        document.getElementById('texto-resultado').textContent = `${vencedor.nome} venceu a batalha contra ${perdedor.nome}!`;
        document.getElementById('trofeu-container').innerHTML = '🏆';
        
        document.getElementById('btn-continuar-torneio').style.display = this.torneioAtivo ? 'block' : 'none';
        this.mostrarTela('tela-resultado');
    }

    continuarTorneio() {
        const vencedor = this.jogadorAtual.vida > 0 ? this.jogadorAtual : this.adversarioAtual;
        this.participantesTorneio.push(vencedor);
        this.atualizarInfoTorneio();
        this.mostrarTela('tela-torneio');
        this.mostrarProximaBatalha();
    }

    mostrarCampeao() {
        const campeao = this.participantesTorneio[0];
        
        document.getElementById('titulo-torneio').textContent = 'Torneio Concluído';
        document.getElementById('info-torneio').innerHTML = `
            <h3>Campeão do Torneio</h3>
            <p>${campeao.nome} (Nível ${campeao.nivel})</p>
            <p>Vitórias: ${campeao.vitorias} | Acertos: ${campeao.perguntasAcertadas}</p>
        `;
        
        document.getElementById('batalha-container').innerHTML = `
            <div class="champion-celebration">
                <div style="font-size: 5rem;">🏆</div>
                <h2>${campeao.nome} é o grande campeão!</h2>
            </div>
        `;
        
        this.torneioAtivo = false;
        this.atualizarTotalJogadores();
    }

    abrirPDF(nomeArquivo) {
        // Substitua por seus PDFs reais
        const pdfs = {
            'citologia-basica.pdf': 'URL_DO_SEU_PDF_1',
            'organelas.pdf': 'URL_DO_SEU_PDF_2',
            'membrana-celular.pdf': 'URL_DO_SEU_PDF_3'
        };
        
        if (pdfs[nomeArquivo]) {
            window.open(pdfs[nomeArquivo], '_blank');
        } else {
            alert('Material de estudo ainda não disponível. Em breve!');
        }
    }
}

// Inicializa o jogo quando a página carrega
document.addEventListener('DOMContentLoaded', () => new QuizBattle());