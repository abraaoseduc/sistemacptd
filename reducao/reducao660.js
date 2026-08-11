function gerarCalculo660Reducao(data, valorRemuneracao = 0, valorPVR = 0, tipoLancamento = 'INCLUSÃO', bloqueado = false, numFolha = '', qvf = 1) {
    let rawMatricula = String(data.matricula || '').trim().replace(/^22200[0-9]/, '');

    const matricula = rawMatricula;
    const nome = data.nome || '';
    const textoLancamento = tipoLancamento.toUpperCase();

    // Data de Alteração
    const dtAltStr = data.dtalt || data.dtinialt || '';
    const partesAlt = dtAltStr.split('/');
    
    let diaAlt = 0, mesAlt = 0, anoAlt = 0;
    if (partesAlt.length === 3) {
        diaAlt = parseInt(partesAlt[0], 10) || 0;
        mesAlt = parseInt(partesAlt[1], 10) || 0;
        anoAlt = parseInt(partesAlt[2], 10) || 0;
    }

    const diasNoMes = (mesAlt > 0 && anoAlt > 0) ? new Date(anoAlt, mesAlt, 0).getDate() : 30;
    const diasDevolver = (mesAlt > 0 && anoAlt > 0 && diaAlt > 0) 
        ? Math.max(0, (diasNoMes - diaAlt) + 1) 
        : 0;

    const chOriginalNum = parseInt(data.chNum || 0, 10);
    const chatuNum = parseInt(data.chatu || data.chatuNum || 0, 10);
    const siglaUpper = (data.sigla || '').toUpperCase();

    let baseVencimentoOriginal = 0;
    let baseVencimentoCHATU = 0;

    const eK081ouK082 = siglaUpper.includes('K081') || siglaUpper.includes('K082');
    const eK084ouK085 = siglaUpper.includes('K084') || siglaUpper.includes('K085');

    if (eK081ouK082 && typeof TABELA_K081_K082 !== 'undefined') {
        const infoOrig = TABELA_K081_K082[chOriginalNum];
        if (infoOrig) baseVencimentoOriginal = infoOrig.somatorio;

        const infoRed = TABELA_K081_K082[chatuNum];
        if (infoRed) baseVencimentoCHATU = infoRed.somatorio;
    } else if (eK084ouK085 && typeof TABELA_K084_K085 !== 'undefined') {
        const infoOrig = TABELA_K084_K085[chOriginalNum];
        if (infoOrig) baseVencimentoOriginal = infoOrig.remuneracao;

        const infoRed = TABELA_K084_K085[chatuNum];
        if (infoRed) baseVencimentoCHATU = infoRed.remuneracao;
    }

    const diferencaVencimento = Math.max(0, baseVencimentoOriginal - baseVencimentoCHATU);
    const valorDiaDiferenca = diasNoMes > 0 ? (diferencaVencimento / diasNoMes) : 0;
    const valorTotalFinal = Math.round((valorDiaDiferenca * diasDevolver) * 100) / 100;

    const qtdQVF = Math.max(1, parseInt(qvf, 10) || 1);
    const valorParcela = Math.round((valorTotalFinal / qtdQVF) * 100) / 100;

    const stringCalculosTexto = `(R$ ${diferencaVencimento.toFixed(2).replace('.', ',')} / ${diasNoMes} dias * ${diasDevolver} dias = R$ ${valorTotalFinal.toFixed(2).replace('.', ',')})`;

    const htmlDetalhesCalculo = `
        • <strong>Mês de Referência da Alteração (${mesAlt.toString().padStart(2, '0')}/${anoAlt}):</strong> ${diasNoMes} dias<br>
        • <strong>Carga Horária:</strong> De ${chOriginalNum}h para ${chatuNum}h<br>
        • <strong>Diferença de Base Salarial:</strong> R$ ${diferencaVencimento.toFixed(2).replace('.', ',')}<br>
        • <strong>Valor Dia da Diferença:</strong> R$ ${valorDiaDiferenca.toFixed(2).replace('.', ',')}<br>
        • <strong>Dias a Devolver:</strong> ${diasDevolver} dias (do dia ${diaAlt} ao dia ${diasNoMes})<br>
        • <strong>Cálculo de Anulação:</strong> R$ ${diferencaVencimento.toFixed(2).replace('.', ',')} / ${diasNoMes} * ${diasDevolver} = <strong>R$ ${valorTotalFinal.toFixed(2).replace('.', ',')}</strong><br>
        • <strong>Divisão QVF:</strong> 
          <input type="number" class="js-qvf-input" id="qvf_660_${data.cardId}" min="1" value="${qtdQVF}" style="width: 55px; padding: 0.1rem 0.3rem; font-size: 0.85rem; font-weight: bold; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center; display: inline-block;">
          parcela(s) de <strong id="valor_parcela_660_${data.cardId}">R$ ${valorParcela.toFixed(2).replace('.', ',')}</strong>
    `;

    let complementoBloqueio = '';
    if (bloqueado) {
        complementoBloqueio = numFolha.trim() !== '' 
            ? ` PAGAMENTO BLOQUEADO NA FOLHA ${numFolha.trim()}` 
            : ' PAGAMENTO BLOQUEADO NA FOLHA';
    }

    const detalhamentoPlanilha = `${textoLancamento} DE DESPESA ANULAR REFERENTE A DEVOLUÇÃO DE ${diasDevolver} DIAS DE VENCIMENTO RECEBIDOS INDEVIDAMENTE DEVIDO À REDUÇÃO DE CARGA HORÁRIA (${chOriginalNum}H PARA ${chatuNum}H) EM ${dtAltStr} ${stringCalculosTexto}, PARCELADO EM ${qtdQVF}X (QVF)${complementoBloqueio}`;
    const textoJustificativa = `${matricula} ${nome.toUpperCase()} ${detalhamentoPlanilha}`;

    const copyTextId = `copy_text_660_reducao_${data.cardId}`;

    const dadosExportacao = {
        matricula: String(matricula),
        nome: nome,
        sigla: data.sigla,
        doeData: data.dtpubl || '-',
        doePagina: data.pagdoe || '-',
        doeCaderno: data.caddoe || '-',
        rubrica: '660 (Redução)',
        valorCalculado: `${valorParcela.toFixed(2).replace('.', ',')} (${qtdQVF} QVF)`,
        detalhamentoCalculo: detalhamentoPlanilha
    };

    const jsonExportStr = encodeURIComponent(JSON.stringify(dadosExportacao));

    return `
        <div class="calc-card-item js-card-660" data-card-id="${data.cardId}">
            <h4>RUBRICA 660 - DESPESA ANULAR (REDUÇÃO MÊS ANTERIOR)</h4>

            <div class="calc-details">
                ${htmlDetalhesCalculo}
            </div>

            <div class="lancamento-selector" style="margin: 0.75rem 0; font-size: 0.85rem; background: #ffffff; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 4px;">
                <strong style="display:block; margin-bottom: 0.3rem; color: var(--text-dark);">Tipo de Lançamento:</strong>
                <label style="margin-right: 15px; cursor: pointer; font-weight: 500;">
                    <input type="radio" class="js-tipo-lancamento" name="tipo_660_reducao_${data.cardId}" value="INCLUSÃO" ${tipoLancamento === 'INCLUSÃO' ? 'checked' : ''}> INCLUSÃO
                </label>
                <label style="cursor: pointer; font-weight: 500;">
                    <input type="radio" class="js-tipo-lancamento" name="tipo_660_reducao_${data.cardId}" value="ALTERAÇÃO" ${tipoLancamento === 'ALTERAÇÃO' ? 'checked' : ''}> ALTERAÇÃO
                </label>
            </div>

            <div class="folha-selector" style="margin: 0.75rem 0; font-size: 0.85rem; background: #ffffff; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 4px;">
                <strong style="display:block; margin-bottom: 0.3rem; color: var(--text-dark);">Situação no Folha/Multipag:</strong>
                <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                    <label style="cursor: pointer; font-weight: 500; display: inline-flex; align-items: center; gap: 0.3rem;">
                        <input type="checkbox" class="js-chk-bloqueio" id="chk_bloqueio_660_reducao_${data.cardId}" ${bloqueado ? 'checked' : ''}> BLOQUEIO DE PAGAMENTO REALIZADO NA FOLHA
                    </label>
                    <input type="text" class="js-num-folha" id="num_folha_660_reducao_${data.cardId}" placeholder="Nº da folha" value="${numFolha}" style="padding: 0.2rem 0.4rem; font-size: 0.8rem; border: 1px solid #cbd5e1; border-radius: 4px; width: 100px;">
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

// Manipulador global que atualiza apenas o texto sem recriar nenhum HTML
document.addEventListener('input', function (e) {
    if (e.target.matches('.js-qvf-input, .js-num-folha')) {
        atualizarCamposSemRecriarDOM(e.target);
    }
});

document.addEventListener('change', function (e) {
    if (e.target.matches('.js-tipo-lancamento, .js-chk-bloqueio, .js-qvf-input')) {
        atualizarCamposSemRecriarDOM(e.target);
    }
});

function atualizarCamposSemRecriarDOM(targetElement) {
    const cardItem = targetElement.closest('.js-card-660');
    if (!cardItem) return;

    // Encontra o container principal que guarda os dados JSON
    const containerPai = cardItem.closest('[data-json]');
    if (!containerPai) return;

    const cardId = cardItem.getAttribute('data-card-id');
    const data = JSON.parse(decodeURIComponent(containerPai.dataset.json));

    // Captura os valores atuais dos campos sem re-renderizar o HTML
    const inputQvf = cardItem.querySelector('.js-qvf-input');
    let qvfVal = parseInt(inputQvf?.value || 1, 10);
    if (isNaN(qvfVal) || qvfVal < 1) qvfVal = 1;

    const radioChecked = cardItem.querySelector('.js-tipo-lancamento:checked');
    const tipoLancamento = radioChecked ? radioChecked.value : 'INCLUSÃO';

    const chkBloqueio = cardItem.querySelector('.js-chk-bloqueio');
    const bloqueado = chkBloqueio ? chkBloqueio.checked : false;

    const inputNumFolha = cardItem.querySelector('.js-num-folha');
    const numFolha = inputNumFolha ? inputNumFolha.value : '';

    // Cálculos matemáticos
    const dtAltStr = data.dtalt || data.dtinialt || '';
    const partesAlt = dtAltStr.split('/');
    let diaAlt = 0, mesAlt = 0, anoAlt = 0;
    if (partesAlt.length === 3) {
        diaAlt = parseInt(partesAlt[0], 10) || 0;
        mesAlt = parseInt(partesAlt[1], 10) || 0;
        anoAlt = parseInt(partesAlt[2], 10) || 0;
    }

    const diasNoMes = (mesAlt > 0 && anoAlt > 0) ? new Date(anoAlt, mesAlt, 0).getDate() : 30;
    const diasDevolver = (mesAlt > 0 && anoAlt > 0 && diaAlt > 0) ? Math.max(0, (diasNoMes - diaAlt) + 1) : 0;
    const chOriginalNum = parseInt(data.chNum || 0, 10);
    const chatuNum = parseInt(data.chatu || data.chatuNum || 0, 10);
    const siglaUpper = (data.sigla || '').toUpperCase();

    let baseVencimentoOriginal = 0, baseVencimentoCHATU = 0;
    const eK081ouK082 = siglaUpper.includes('K081') || siglaUpper.includes('K082');
    const eK084ouK085 = siglaUpper.includes('K084') || siglaUpper.includes('K085');

    if (eK081ouK082 && typeof TABELA_K081_K082 !== 'undefined') {
        baseVencimentoOriginal = TABELA_K081_K082[chOriginalNum]?.somatorio || 0;
        baseVencimentoCHATU = TABELA_K081_K082[chatuNum]?.somatorio || 0;
    } else if (eK084ouK085 && typeof TABELA_K084_K085 !== 'undefined') {
        baseVencimentoOriginal = TABELA_K084_K085[chOriginalNum]?.remuneracao || 0;
        baseVencimentoCHATU = TABELA_K084_K085[chatuNum]?.remuneracao || 0;
    }

    const diferencaVencimento = Math.max(0, baseVencimentoOriginal - baseVencimentoCHATU);
    const valorDiaDiferenca = diasNoMes > 0 ? (diferencaVencimento / diasNoMes) : 0;
    const valorTotalFinal = Math.round((valorDiaDiferenca * diasDevolver) * 100) / 100;
    const valorParcela = Math.round((valorTotalFinal / qvfVal) * 100) / 100;

    // Atualização de elementos na tela
    const elValorParcela = cardItem.querySelector(`#valor_parcela_660_${cardId}`);
    if (elValorParcela) {
        elValorParcela.textContent = `R$ ${valorParcela.toFixed(2).replace('.', ',')}`;
    }

    const stringCalculosTexto = `(R$ ${diferencaVencimento.toFixed(2).replace('.', ',')} / ${diasNoMes} dias * ${diasDevolver} dias = R$ ${valorTotalFinal.toFixed(2).replace('.', ',')})`;
    let complementoBloqueio = bloqueado ? (numFolha.trim() !== '' ? ` PAGAMENTO BLOQUEADO NA FOLHA ${numFolha.trim()}` : ' PAGAMENTO BLOQUEADO NA FOLHA') : '';
    const detalhamentoPlanilha = `${tipoLancamento.toUpperCase()} DE DESPESA ANULAR REFERENTE A DEVOLUÇÃO DE ${diasDevolver} DIAS DE VENCIMENTO RECEBIDOS INDEVIDAMENTE DEVIDO À REDUÇÃO DE CARGA HORÁRIA (${chOriginalNum}H PARA ${chatuNum}H) EM ${dtAltStr} ${stringCalculosTexto}, PARCELADO EM ${qvfVal}X (QVF)${complementoBloqueio}`;
    
    let rawMatricula = String(data.matricula || '').trim().replace(/^22200[0-9]/, '');
    const copyBox = cardItem.querySelector(`#copy_text_660_reducao_${cardId}`);
    if (copyBox) {
        copyBox.textContent = `${rawMatricula} ${(data.nome || '').toUpperCase()} ${detalhamentoPlanilha}`;
    }

    const chkRelatorio = cardItem.querySelector(`#chk_copy_text_660_reducao_${cardId}`);
    if (chkRelatorio) {
        const dadosExportacao = {
            matricula: String(rawMatricula),
            nome: data.nome || '',
            sigla: data.sigla,
            doeData: data.dtpubl || '-',
            doePagina: data.pagdoe || '-',
            doeCaderno: data.caddoe || '-',
            rubrica: '660 (Redução)',
            valorCalculado: `${valorParcela.toFixed(2).replace('.', ',')} (${qvfVal} QVF)`,
            detalhamentoCalculo: detalhamentoPlanilha
        };
        chkRelatorio.dataset.export = encodeURIComponent(JSON.stringify(dadosExportacao));
    }
}