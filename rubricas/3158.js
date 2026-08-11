function gerarCalculo3158(data, vencimento) {
    const mesesTrabalhados = calcularMesesTrabalhados(data.dtini, data.dtalt);
    const umDozeAvosBruto = vencimento / 12;
    const umDozeAvosArred = Math.round(umDozeAvosBruto * 100) / 100;
    const valorTotal3158 = Math.round((umDozeAvosArred * mesesTrabalhados) * 100) / 100;

    const memoriaCalculoStr = `${formatarMoeda(vencimento)} / 12 = ${formatarMoeda(umDozeAvosArred)} * ${mesesTrabalhados} MESES = ${formatarMoeda(valorTotal3158)}`;
    
    // Texto do Detalhamento EXCLUSIVO para a Planilha (Sem Matrícula e Nome para evitar duplicidade)
    const detalhamentoPlanilha = `INCLUSÃO DE PAGAMENTO DE 13° SALÁRIO REFERENTE A ${mesesTrabalhados}/12 AVOS (${memoriaCalculoStr}), DEVIDO RESCISÃO DE CONTRATO EM ${data.dtalt}`;

    // Texto da Justificativa Completa (Exibido no Card e Copiado)
    const textoJustificativa = `${data.matricula} ${data.nome.toUpperCase()} ${detalhamentoPlanilha}`;

    const copyTextId = `copy_text_3158_${data.cardId}`;

    // Objeto com os dados para exportação por colunas (Garantindo 2 dígitos decimais)
    const dadosExportacao = {
        matricula: data.matricula,
        nome: data.nome,
        sigla: data.sigla,
        doeData: data.dtpubl || '-',
        doePagina: data.pagdoe || '-',
        doeCaderno: data.caddoe || '-',
        rubrica: '3158',
        valorCalculado: valorTotal3158.toFixed(2).replace('.', ','),
        detalhamentoCalculo: detalhamentoPlanilha
    };

    const jsonExportStr = encodeURIComponent(JSON.stringify(dadosExportacao));

    return `
        <div class="calc-card-item">
            <h4>RUBRICA 3158 - DÉCIMO TERCEIRO (RESCISÃO)</h4>
            <div class="calc-details">
                <strong>Período considerado:</strong> ${data.dtini} a ${data.dtalt}<br>
                <strong>Meses com &ge; 15 dias:</strong> ${mesesTrabalhados} mês(es)<br>
                <strong>1/12 Avos do Vencimento:</strong> ${formatarMoeda(vencimento)} &divide; 12 = ${formatarMoeda(umDozeAvosArred)}<br>
                <strong>Valor Total (3158):</strong> ${formatarMoeda(umDozeAvosArred)} &times; ${mesesTrabalhados} = <strong>${formatarMoeda(valorTotal3158)}</strong>
            </div>

            <div class="copy-box-container">
                <div class="copy-box-text" id="${copyTextId}" contenteditable="false">${textoJustificativa}</div>
                
                <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;">
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <!-- Botão Editar Cálculos -->
                        <button class="btn-copy" style="background-color: #d97706;" id="btn_edit_${copyTextId}" onclick="habilitarEdicaoCalculo('${copyTextId}')">
                            ✏️ Editar Cálculos
                        </button>

                        <!-- Botão Copiar Texto -->
                        <button class="btn-copy" onclick="copiarTexto('${copyTextId}')">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            Copiar Texto
                        </button>
                    </div>
                    
                    <!-- Caixa de Seleção para Adicionar ao Relatório Final -->
                    <label style="display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; font-weight: 600; color: #15803d; cursor: pointer; margin-top: 0.25rem;">
                        <input type="checkbox" class="chk-relatorio-rubrica" id="chk_${copyTextId}" data-export="${jsonExportStr}" style="accent-color: #16a34a; width: 15px; height: 15px; cursor: pointer;">
                        Adicionar cálculos ao relatório final
                    </label>
                </div>
            </div>
        </div>
    `;
}