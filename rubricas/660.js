function gerarCalculo660(data, valorRemuneracao, valorPVR = 0, tipoLancamento = 'INCLUSÃO', bloqueado = false, numFolha = '') {
    const matricula = data.matricula || '';
    const nome = data.nome || '';
    const textoLancamento = tipoLancamento.toUpperCase();

    // Data de Rescisão (DTALT)
    const dtAltStr = data.dtalt || '';
    const partesAlt = dtAltStr.split('/');
    
    let diaAlt = 0;
    let mesAlt = 0;
    let anoAlt = 0;

    if (partesAlt.length === 3) {
        diaAlt = parseInt(partesAlt[0], 10) || 0;
        mesAlt = parseInt(partesAlt[1], 10) || 0;
        anoAlt = parseInt(partesAlt[2], 10) || 0;
    }

    // Dias no mês e dias a devolver (a partir do dia seguinte à rescisão)
    const diasNoMes = (mesAlt > 0 && anoAlt > 0) ? new Date(anoAlt, mesAlt, 0).getDate() : 30;
    const diasDevolver = Math.max(0, diasNoMes - diaAlt);

    // Base de cálculo: Remuneração + PVR (Vencimento)
    const baseCalculo = valorRemuneracao + valorPVR;
    const valorDia = diasNoMes > 0 ? (baseCalculo / diasNoMes) : 0;
    const valorTotalFinal = Math.round((valorDia * diasDevolver) * 100) / 100;

    // String detalhada dos cálculos
    const stringCalculosTexto = `(R$ ${baseCalculo.toFixed(2).replace('.', ',')} / ${diasNoMes} dias * ${diasDevolver} dias = R$ ${valorTotalFinal.toFixed(2).replace('.', ',')})`;

    // Detalhamento para a caixa do card
    const detalheBase = valorPVR > 0 
        ? `R$ ${valorRemuneracao.toFixed(2).replace('.', ',')} (Remuneração) + R$ ${valorPVR.toFixed(2).replace('.', ',')} (PVR) = R$ ${baseCalculo.toFixed(2).replace('.', ',')}`
        : `R$ ${valorRemuneracao.toFixed(2).replace('.', ',')} (Remuneração)`;

    const htmlDetalhesCalculo = `
        • <strong>Mês de Referência (${mesAlt.toString().padStart(2, '0')}/${anoAlt}):</strong> ${diasNoMes} dias<br>
        • <strong>Base de Vencimento:</strong> ${detalheBase}<br>
        • <strong>Dias a Devolver:</strong> ${diasDevolver} dias (${diasNoMes} - ${diaAlt})<br>
        • <strong>Cálculo de Anulação:</strong> R$ ${baseCalculo.toFixed(2).replace('.', ',')} / ${diasNoMes} dias * ${diasDevolver} dias = <strong>R$ ${valorTotalFinal.toFixed(2).replace('.', ',')}</strong>
    `;

    // Bloqueio
    let complementoBloqueio = '';
    if (bloqueado) {
        complementoBloqueio = String(numFolha).trim() !== '' 
            ? ` PAGAMENTO BLOQUEADO NA FOLHA ${String(numFolha).trim()}` 
            : ' PAGAMENTO BLOQUEADO NA FOLHA';
    }

    // Texto do Detalhamento EXCLUSIVO para a Planilha (Sem Matrícula e Nome para evitar duplicidade)
    const detalhamentoPlanilha = `${textoLancamento} DE DESPESA ANULAR REFERENTE A DEVOLUÇÃO DE ${diasDevolver} DIAS DE VENCIMENTO RECEBIDOS INDEVIDAMENTE ${stringCalculosTexto}, DEVIDO RESCISÃO DE CONTRATO EM ${data.dtalt}${complementoBloqueio}`;

    // Texto da Justificativa Completa (Exibido no Card e Copiado)
    const textoJustificativa = `${matricula} ${nome.toUpperCase()} ${detalhamentoPlanilha}`;

    const copyTextId = `copy_text_660_${data.cardId}`;

    // Objeto com os dados para exportação por colunas (Garantindo 2 dígitos decimais)
    const dadosExportacao = {
        matricula: matricula,
        nome: nome,
        sigla: data.sigla,
        doeData: data.dtpubl || '-',
        doePagina: data.pagdoe || '-',
        doeCaderno: data.caddoe || '-',
        rubrica: '660',
        valorCalculado: valorTotalFinal.toFixed(2).replace('.', ','),
        detalhamentoCalculo: detalhamentoPlanilha
    };

    const jsonExportStr = encodeURIComponent(JSON.stringify(dadosExportacao));

    // Array com 12 cores claras e distintas para os botões
    const coresFolhas = [
        '#e0f2fe', '#dcfce7', '#fef9c3', '#ffe4e6', '#f3e8ff', '#e0e7ff',
        '#ccfbf1', '#ffedd5', '#fce7f3', '#f1f5f9', '#d1fae5', '#fef08a'
    ];

    let botoesFolhaHTML = '';
    for (let i = 1; i <= 12; i++) {
        const estaSelecionado = String(numFolha).trim() === String(i);
        const bgCor = coresFolhas[i - 1];
        const estiloSelecionado = estaSelecionado 
            ? `background-color: #2563eb; color: #ffffff; font-weight: bold; border-color: #1d4ed8; shadow: inset 0 2px 4px rgba(0,0,0,0.2);` 
            : `background-color: ${bgCor}; color: #334155; border-color: #cbd5e1;`;

        botoesFolhaHTML += `
            <button type="button" 
                    onclick="selecionarFolha660('${data.cardId}', '${i}')"
                    style="padding: 0.35rem 0.2rem; font-size: 0.75rem; border: 1px solid; border-radius: 4px; cursor: pointer; transition: all 0.2s; ${estiloSelecionado}">
                FOLHA ${i}
            </button>
        `;
    }

    return `
        <div class="calc-card-item">
            <h4>RUBRICA 660 - DESPESA ANULAR</h4>

            <div class="calc-details">
                ${htmlDetalhesCalculo}
            </div>

            <div class="lancamento-selector" style="margin: 0.75rem 0; font-size: 0.85rem; background: #ffffff; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 4px;">
                <strong style="display:block; margin-bottom: 0.3rem; color: var(--text-dark);">Tipo de Lançamento:</strong>
                <label style="margin-right: 15px; cursor: pointer; font-weight: 500;">
                    <input type="radio" name="tipo_660_${data.cardId}" value="INCLUSÃO" ${tipoLancamento === 'INCLUSÃO' ? 'checked' : ''} onchange="recalcularRubricaEspecifica('${data.cardId}', '660', this.value)"> INCLUSÃO
                </label>
                <label style="cursor: pointer; font-weight: 500;">
                    <input type="radio" name="tipo_660_${data.cardId}" value="ALTERAÇÃO" ${tipoLancamento === 'ALTERAÇÃO' ? 'checked' : ''} onchange="recalcularRubricaEspecifica('${data.cardId}', '660', this.value)"> ALTERAÇÃO
                </label>
            </div>

            <div class="folha-selector" style="margin: 0.75rem 0; font-size: 0.85rem; background: #ffffff; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 4px;">
                <strong style="display:block; margin-bottom: 0.3rem; color: var(--text-dark);">Situação no Folha/Multipag:</strong>
                <div>
                    <label style="cursor: pointer; font-weight: 500; display: inline-flex; align-items: center; gap: 0.3rem;">
                        <input type="checkbox" id="chk_bloqueio_660_${data.cardId}" ${bloqueado ? 'checked' : ''} onchange="atualizarBloqueioFolha660('${data.cardId}')"> BLOQUEIO DE PAGAMENTO REALIZADO NA FOLHA
                    </label>
                </div>

                <input type="hidden" id="num_folha_660_${data.cardId}" value="${numFolha}">

                <div id="painel_folhas_660_${data.cardId}" style="display: ${bloqueado ? 'grid' : 'none'}; grid-template-columns: repeat(6, 1fr); gap: 0.35rem; margin-top: 0.5rem;">
                    ${botoesFolhaHTML}
                </div>
            </div>

            <div class="copy-box-container">
                <div class="copy-box-text" id="${copyTextId}" contenteditable="false">${textoJustificativa}</div>
                
                <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;">
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button class="btn-copy" style="background-color: #d97706;" id="btn_edit_${copyTextId}" onclick="habilitarEdicaoCalculo('${copyTextId}')">
                            ✏️ Editar Cálculos
                        </button>

                        <button class="btn-copy" onclick="copiarTexto('${copyTextId}')">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            Copiar Texto
                        </button>
                    </div>
                    
                    <label style="display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; font-weight: 600; color: #15803d; cursor: pointer; margin-top: 0.25rem;">
                        <input type="checkbox" class="chk-relatorio-rubrica" id="chk_${copyTextId}" data-export="${jsonExportStr}" style="accent-color: #16a34a; width: 15px; height: 15px; cursor: pointer;">
                        Adicionar cálculos ao relatório final
                    </label>
                </div>
            </div>
        </div>
    `;
}

function atualizarBloqueioFolha660(cardId) {
    const chk = document.getElementById(`chk_bloqueio_660_${cardId}`);
    const painel = document.getElementById(`painel_folhas_660_${cardId}`);
    const inputHidden = document.getElementById(`num_folha_660_${cardId}`);

    if (chk && painel) {
        if (!chk.checked) {
            if (inputHidden) inputHidden.value = '';
        }
        painel.style.display = chk.checked ? 'grid' : 'none';
    }
    if (typeof atualizarBloqueioFolha === 'function') {
        atualizarBloqueioFolha(cardId, '660');
    }
}

function selecionarFolha660(cardId, numFolha) {
    const inputHidden = document.getElementById(`num_folha_660_${cardId}`);
    if (!inputHidden) return;

    if (inputHidden.value === String(numFolha)) {
        inputHidden.value = '';
    } else {
        inputHidden.value = String(numFolha);
    }

    if (typeof atualizarBloqueioFolha === 'function') {
        atualizarBloqueioFolha(cardId, '660');
    }
}