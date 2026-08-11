function gerarCalculo476Reducao(data, valorPVR = 0, tipoLancamento = 'INCLUSÃO', bloqueado = false, numFolha = '') {
    let rawMatricula = String(data.matricula || '').trim().replace(/^22200[0-9]/, '');

    const matricula = rawMatricula;
    const nome = data.nome || '';
    const textoLancamento = tipoLancamento.toUpperCase();

    const dtAltStr = data.dtalt || data.dtinialt || '';
    const partesAlt = dtAltStr.split('/');
    
    let diaAlt = 0, mesAlt = 0, anoAlt = 0;
    if (partesAlt.length === 3) {
        diaAlt = parseInt(partesAlt[0], 10) || 0;
        mesAlt = parseInt(partesAlt[1], 10) || 0;
        anoAlt = parseInt(partesAlt[2], 10) || 0;
    }

    const diasNoMes = (mesAlt > 0 && anoAlt > 0) ? new Date(anoAlt, mesAlt, 0).getDate() : 30;
    const diasDevidos = Math.max(0, diaAlt - 1);

    const chatuNum = parseInt(data.chatu || data.chatuNum || 0, 10);
    const siglaUpper = (data.sigla || '').toUpperCase();

    let basePVR = valorPVR || 0;
    const eK081ouK082 = siglaUpper.includes('K081') || siglaUpper.includes('K082');

    if (basePVR === 0 && eK081ouK082 && typeof TABELA_K081_K082 !== 'undefined') {
        const info = TABELA_K081_K082[chatuNum];
        if (info) basePVR = info.pvr || 0;
    }

    if (basePVR <= 0) return '';

    const valorDia = diasNoMes > 0 ? (basePVR / diasNoMes) : 0;
    const valorTotalFinal = Math.round((valorDia * diasDevidos) * 100) / 100;

    const stringCalculosTexto = `(R$ ${basePVR.toFixed(2).replace('.', ',')} / ${diasNoMes} dias * ${diasDevidos} dias = R$ ${valorTotalFinal.toFixed(2).replace('.', ',')})`;

    const htmlDetalhesCalculo = `
        • <strong>Mês Vigente (${mesAlt.toString().padStart(2, '0')}/${anoAlt}):</strong> ${diasNoMes} dias<br>
        • <strong>Carga Horária Reduzida (CHATU):</strong> ${chatuNum}h<br>
        • <strong>PVR de ${chatuNum}h:</strong> R$ ${basePVR.toFixed(2).replace('.', ',')}<br>
        • <strong>Dias a Receber:</strong> ${diasDevidos} dia(s) (referente a ${diasDevidos} dia(s) trabalhado(s) antes do dia ${diaAlt})<br>
        • <strong>Cálculo Proporcional PVR:</strong> R$ ${basePVR.toFixed(2).replace('.', ',')} / ${diasNoMes} * ${diasDevidos} = <strong>R$ ${valorTotalFinal.toFixed(2).replace('.', ',')}</strong>
    `;

    let complementoBloqueio = '';
    if (bloqueado) {
        complementoBloqueio = numFolha.trim() !== '' 
            ? ` PAGAMENTO BLOQUEADO NA FOLHA ${numFolha.trim()}` 
            : ' PAGAMENTO BLOQUEADO NA FOLHA';
    }

    const detalhamentoPlanilha = `${textoLancamento} DE PAGAMENTO DE DIFERENÇA REFERENTE A PVR DE ${diasDevidos} DIAS DE CARGA HORÁRIA REDUZIDA (${chatuNum}H) EM ${dtAltStr} ${stringCalculosTexto}${complementoBloqueio}`;
    const textoJustificativa = `${matricula} ${nome.toUpperCase()} ${detalhamentoPlanilha}`;
    const copyTextId = `copy_text_476_${data.cardId}`;

    const dadosExportacao = {
        matricula: String(matricula),
        nome: nome,
        sigla: data.sigla,
        doeData: data.dtpubl || '-',
        doePagina: data.pagdoe || '-',
        doeCaderno: data.caddoe || '-',
        rubrica: '476 (Redução)',
        valorCalculado: valorTotalFinal,
        detalhamentoCalculo: detalhamentoPlanilha
    };

    const jsonExportStr = encodeURIComponent(JSON.stringify(dadosExportacao));

    return `
        <div class="calc-card-item js-card-476" data-card-id="${data.cardId}">
            <h4>RUBRICA 476 - DIFERENÇA DE PVR</h4>

            <div class="calc-details">
                ${htmlDetalhesCalculo}
            </div>

            <div class="lancamento-selector" style="margin: 0.75rem 0; font-size: 0.85rem; background: #ffffff; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 4px;">
                <strong style="display:block; margin-bottom: 0.3rem; color: var(--text-dark);">Tipo de Lançamento:</strong>
                <label style="margin-right: 15px; cursor: pointer; font-weight: 500;">
                    <input type="radio" class="js-tipo-476" name="tipo_476_${data.cardId}" value="INCLUSÃO" ${tipoLancamento === 'INCLUSÃO' ? 'checked' : ''}> INCLUSÃO
                </label>
                <label style="cursor: pointer; font-weight: 500;">
                    <input type="radio" class="js-tipo-476" name="tipo_476_${data.cardId}" value="ALTERAÇÃO" ${tipoLancamento === 'ALTERAÇÃO' ? 'checked' : ''}> ALTERAÇÃO
                </label>
            </div>

            <div class="folha-selector" style="margin: 0.75rem 0; font-size: 0.85rem; background: #ffffff; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 4px;">
                <strong style="display:block; margin-bottom: 0.3rem; color: var(--text-dark);">Situação no Folha/Multipag:</strong>
                <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                    <label style="cursor: pointer; font-weight: 500; display: inline-flex; align-items: center; gap: 0.3rem;">
                        <input type="checkbox" class="js-chk-476" id="chk_bloqueio_476_${data.cardId}" ${bloqueado ? 'checked' : ''}> BLOQUEIO DE PAGAMENTO REALIZADO NA FOLHA
                    </label>
                    <input type="text" class="js-num-folha-476" id="num_folha_476_${data.cardId}" placeholder="Nº da folha" value="${numFolha}" style="padding: 0.2rem 0.4rem; font-size: 0.8rem; border: 1px solid #cbd5e1; border-radius: 4px; width: 100px;">
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

// Escutadores Globais para a Rubrica 476
document.addEventListener('change', function (e) {
    if (e.target.matches('.js-tipo-476, .js-chk-476')) {
        atualizarTexto476(e.target);
    }
});

document.addEventListener('input', function (e) {
    if (e.target.matches('.js-num-folha-476')) {
        atualizarTexto476(e.target);
    }
});

function atualizarTexto476(target) {
    const cardItem = target.closest('.js-card-476');
    if (!cardItem) return;

    const containerPai = cardItem.closest('[data-json]');
    if (!containerPai) return;

    const cardId = cardItem.getAttribute('data-card-id');
    const data = JSON.parse(decodeURIComponent(containerPai.dataset.json));

    const radioChecked = cardItem.querySelector('.js-tipo-476:checked');
    const tipoLancamento = radioChecked ? radioChecked.value : 'INCLUSÃO';

    const chkBloqueio = cardItem.querySelector('.js-chk-476');
    const bloqueado = chkBloqueio ? chkBloqueio.checked : false;

    const inputNumFolha = cardItem.querySelector('.js-num-folha-476');
    const numFolha = inputNumFolha ? inputNumFolha.value : '';

    const dtAltStr = data.dtalt || data.dtinialt || '';
    const partesAlt = dtAltStr.split('/');
    let diaAlt = 0, mesAlt = 0, anoAlt = 0;
    if (partesAlt.length === 3) {
        diaAlt = parseInt(partesAlt[0], 10) || 0;
        mesAlt = parseInt(partesAlt[1], 10) || 0;
        anoAlt = parseInt(partesAlt[2], 10) || 0;
    }

    const diasNoMes = (mesAlt > 0 && anoAlt > 0) ? new Date(anoAlt, mesAlt, 0).getDate() : 30;
    const diasDevidos = Math.max(0, diaAlt - 1);
    const chatuNum = parseInt(data.chatu || data.chatuNum || 0, 10);
    const siglaUpper = (data.sigla || '').toUpperCase();

    let basePVR = 0;
    if (siglaUpper.includes('K081') || siglaUpper.includes('K082')) {
        if (typeof TABELA_K081_K082 !== 'undefined' && TABELA_K081_K082[chatuNum]) {
            basePVR = TABELA_K081_K082[chatuNum].pvr || 0;
        }
    }

    const valorDia = diasNoMes > 0 ? (basePVR / diasNoMes) : 0;
    const valorTotalFinal = Math.round((valorDia * diasDevidos) * 100) / 100;

    const stringCalculosTexto = `(R$ ${basePVR.toFixed(2).replace('.', ',')} / ${diasNoMes} dias * ${diasDevidos} dias = R$ ${valorTotalFinal.toFixed(2).replace('.', ',')})`;
    let complementoBloqueio = bloqueado ? (numFolha.trim() !== '' ? ` PAGAMENTO BLOQUEADO NA FOLHA ${numFolha.trim()}` : ' PAGAMENTO BLOQUEADO NA FOLHA') : '';
    const detalhamentoPlanilha = `${tipoLancamento.toUpperCase()} DE PAGAMENTO DE DIFERENÇA REFERENTE A PVR DE ${diasDevidos} DIAS DE CARGA HORÁRIA REDUZIDA (${chatuNum}H) EM ${dtAltStr} ${stringCalculosTexto}${complementoBloqueio}`;

    let rawMatricula = String(data.matricula || '').trim().replace(/^22200[0-9]/, '');
    const copyBox = cardItem.querySelector(`#copy_text_476_${cardId}`);
    if (copyBox) {
        copyBox.textContent = `${rawMatricula} ${(data.nome || '').toUpperCase()} ${detalhamentoPlanilha}`;
    }

    const chkRelatorio = cardItem.querySelector(`#chk_copy_text_476_${cardId}`);
    if (chkRelatorio) {
        const dadosExportacao = {
            matricula: String(rawMatricula),
            nome: data.nome || '',
            sigla: data.sigla,
            doeData: data.dtpubl || '-',
            doePagina: data.pagdoe || '-',
            doeCaderno: data.caddoe || '-',
            rubrica: '476 (Redução)',
            valorCalculado: valorTotalFinal,
            detalhamentoCalculo: detalhamentoPlanilha
        };
        chkRelatorio.dataset.export = encodeURIComponent(JSON.stringify(dadosExportacao));
    }
}