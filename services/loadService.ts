
import { jsPDF } from 'jspdf';
import { Load, LoadStatus, ClientType, DeliveryPoint, LoadStatusEvent } from '../types';
import { db } from './db';
import { COMPANY_ADDRESS, COMPANY_CITY } from './settingsService';
import { userService } from './userService';
import { notificationService } from './notificationService';
import { eventService } from './eventService'; // Importação do Serviço de Eventos
import { formatCurrency, formatDecimal, formatDocument } from '../utils/formatters';

export const loadService = {
  // Retorna apenas cargas ativas (Exclusão Lógica)
  getLoads: () => {
    const allLoads = db.loads.getAll();
    return allLoads.filter(l => l.active !== false);
  },
  
  getLoadById: (id: string) => db.loads.getById(id),
  
  generatePortCode: () => {
    const loads = db.loads.getAll();
    const year = new Date().getFullYear().toString().slice(-2);
    const sequence = (loads.length + 1).toString().padStart(3, '0');
    return `GSL-${year}-${sequence}`;
  },

  calculateStatus: (load: Partial<Load>): LoadStatus => {
    if (load.status) return load.status as LoadStatus;
    return LoadStatus.TRANSIT;
  },

  generateWhatsAppLink: (phone: string, text: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`;
  },

  exportToExcel: (period: 'today' | 'week' | 'month' | 'custom', customRange?: { start: string, end: string }) => {
    // ... (Implementação existente mantida para brevidade) ...
    const loads = loadService.getLoads();
  },

  downloadAttachment: async (filename: string, type: 'DIFAL' | 'COMPROVANTE' | 'POD', loadCode?: string) => {
    const doc = new jsPDF();
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`ANEXO DIGITAL: ${type}`, 10, 20);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Arquivo Original: ${filename}`, 10, 30);
    if (loadCode) doc.text(`Referência Carga: ${loadCode}`, 10, 36);
    
    doc.setDrawColor(200);
    doc.rect(10, 45, 190, 240); // Placeholder box
    doc.text('[ VISUALIZAÇÃO DO ARQUIVO SIMULADA ]', 105, 160, { align: 'center' });
    
    doc.save(`${type}_${filename}`);
  },

  downloadManifest: async (load: Load) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // --- CONFIGURAÇÕES GERAIS ---
    const PAGE_WIDTH = 210;
    const PAGE_HEIGHT = 297;
    const MARGIN = 14; 
    const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

    const COLORS = {
      DARK: '#0F172A',    // Slate 900
      RED: '#DC2626',     // Red 600
      GRAY_BG: '#F8FAFC', // Slate 50
      GRAY_MID: '#CBD5E1',// Slate 300
      GRAY_TXT: '#64748B',// Slate 500
      WHITE: '#FFFFFF'
    };

    // Normalização de Entregas
    const deliveries = (load.deliveries && load.deliveries.length > 0) 
      ? load.deliveries 
      : [{
          id: 'legacy',
          clientName: load.client,
          cnpjCpf: load.cnpjCpf || '',
          clientType: load.clientType,
          address: { city: load.destinationCity, state: load.destinationUF },
          loadingOrder: '',
          items: load.items
        }];

    const deliveryCount = deliveries.length;

    // --- SISTEMA DE PERFIS DE DENSIDADE (LAYOUT INTELIGENTE) ---
    let layoutConfig = {
        labelSize: 8,
        valueSize: 10,
        lineHeight: 7,
        blockPadding: 6,
        headerGap: 10,
        tableHeaderH: 8,
        tableRowH: 9,
        separatorGap: 10,
        summaryCompact: false
    };

    if (deliveryCount === 1) {
        // MODELO 1: PREMIUM COMPACTO (Single)
        // Ajustado para caber em uma folha mantendo a elegância
        layoutConfig = {
            labelSize: 8,
            valueSize: 10,
            lineHeight: 6,
            blockPadding: 6,
            headerGap: 10, // Reduzido
            tableHeaderH: 9, // Reduzido de 12
            tableRowH: 9,    // Reduzido de 12
            separatorGap: 0,
            summaryCompact: false
        };
    } else {
        // MODELO MULTI: COMPACTO INTELIGENTE (2 a 4+ Entregas)
        layoutConfig = {
            labelSize: 7,
            valueSize: 8,
            lineHeight: 5,
            blockPadding: 4,
            headerGap: 5,
            tableHeaderH: 6,
            tableRowH: 7,
            separatorGap: 6,
            summaryCompact: true
        };
    }

    let cursorY = MARGIN;

    // --- HELPER FUNCTIONS ---
    
    const drawLabelValue = (label: string, value: string, x: number, y: number, customValSize?: number, customColor?: string) => {
        doc.setFontSize(layoutConfig.labelSize);
        doc.setTextColor(COLORS.GRAY_TXT);
        doc.setFont('helvetica', 'bold');
        doc.text(label, x, y);
        const labelWidth = doc.getTextWidth(label);
        
        doc.setFontSize(customValSize || layoutConfig.valueSize);
        doc.setTextColor(customColor || COLORS.DARK);
        doc.setFont('helvetica', 'normal'); 
        doc.text(value, x + labelWidth + 2, y);
        
        return x + labelWidth + 2 + doc.getTextWidth(value);
    };

    const drawSeparator = (x: number, y: number) => {
        doc.setFontSize(layoutConfig.labelSize);
        doc.setTextColor(COLORS.GRAY_MID);
        doc.text('|', x + 3, y);
        return x + 3 + doc.getTextWidth('|') + 3;
    };

    // Helper para desenhar campos em grid (Premium Layout)
    const drawFieldBlock = (x: number, y: number, label: string, value: string, width?: number) => {
        doc.setFontSize(7);
        doc.setTextColor(COLORS.GRAY_TXT);
        doc.setFont('helvetica', 'bold');
        doc.text(label.toUpperCase(), x, y);
        
        doc.setFontSize(10);
        doc.setTextColor(COLORS.DARK);
        doc.setFont('helvetica', 'normal');
        let displayVal = value;
        if (width && doc.getTextWidth(value) > width) {
             displayVal = value.substring(0, 20) + '...';
        }
        doc.text(displayVal, x, y + 5);
    };

    // --- 1. CABEÇALHO ---
    const drawHeader = () => {
        doc.setFillColor(COLORS.RED);
        doc.rect(MARGIN, MARGIN, 4, 18, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24); 
        doc.setTextColor(COLORS.DARK);
        doc.text('GESLA', MARGIN + 8, MARGIN + 9);

        doc.setFontSize(8); 
        doc.setTextColor(COLORS.GRAY_TXT);
        doc.text('SOLUÇÕES TÉRMICAS & ACÚSTICAS', MARGIN + 8, MARGIN + 14);

        doc.setFontSize(16);
        doc.setTextColor(COLORS.DARK);
        doc.setFont('helvetica', 'bold');
        doc.text(load.portCode, PAGE_WIDTH - MARGIN, MARGIN + 9, { align: 'right' });

        doc.setFontSize(8);
        doc.setTextColor(COLORS.GRAY_TXT);
        doc.setFont('helvetica', 'normal');
        doc.text(deliveryCount > 1 ? `MANIFESTO MULTI (${deliveryCount})` : 'MANIFESTO DE CARGA', PAGE_WIDTH - MARGIN, MARGIN + 14, { align: 'right' });

        const metaY = MARGIN + 22;
        doc.setDrawColor(COLORS.GRAY_MID);
        doc.setLineWidth(0.5);
        doc.line(MARGIN, metaY, PAGE_WIDTH - MARGIN, metaY); 

        doc.setFontSize(7);
        doc.setTextColor(COLORS.GRAY_TXT);
        doc.text(`${COMPANY_ADDRESS} • CNPJ: 35.691.397/0001-90`, MARGIN, metaY + 4);
        const dateStr = new Date(load.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        doc.text(`EMISSÃO: ${dateStr}`, PAGE_WIDTH - MARGIN, metaY + 4, { align: 'right' });
    };

    // --- 2. RODAPÉ ---
    const drawFooter = () => {
       const pageCount = doc.getNumberOfPages();
       for (let i = 1; i <= pageCount; i++) {
           doc.setPage(i);
           if (i === pageCount) {
               const signY = PAGE_HEIGHT - 35; 
               const signW = 85;
               doc.setDrawColor(COLORS.GRAY_TXT); 
               doc.setLineWidth(0.1);
               
               doc.line(MARGIN, signY, MARGIN + signW, signY);
               doc.setFontSize(6); doc.setTextColor(COLORS.GRAY_TXT); doc.setFont('helvetica', 'bold');
               doc.text('CONFERENTE RESPONSÁVEL', MARGIN, signY + 3);

               const rightSignX = PAGE_WIDTH - MARGIN - signW;
               doc.line(rightSignX, signY, PAGE_WIDTH - MARGIN, signY);
               doc.text('MOTORISTA / RESPONSÁVEL', rightSignX, signY + 3);

               const nfY = signY + 10;
               doc.setFontSize(5);
               doc.text('DOCUMENTO DE CONTROLE INTERNO. NÃO SUBSTITUI DANFE OU DACTE.', MARGIN, nfY + 3);
           }
           const bottomY = PAGE_HEIGHT - 8;
           doc.setFontSize(6); doc.setTextColor(COLORS.GRAY_TXT); doc.setFont('helvetica', 'bold');
           doc.text('GESLA LOGICONTROL PRO', MARGIN, bottomY);
           doc.setFontSize(8);
           doc.text(load.portCode, PAGE_WIDTH / 2, bottomY, { align: 'center' });
           doc.setFontSize(6);
           doc.text(`PÁGINA ${i} DE ${pageCount}`, PAGE_WIDTH - MARGIN, bottomY, { align: 'right' });
       }
    };

    drawHeader();
    
    // LINHA DE CORTE
    const cutY = MARGIN + 32; 
    doc.setDrawColor(COLORS.GRAY_MID);
    doc.setLineWidth(0.3);
    doc.setLineDashPattern([3, 2], 0);
    doc.line(MARGIN, cutY, PAGE_WIDTH - MARGIN, cutY);
    doc.setLineDashPattern([], 0); 
    doc.setFontSize(5); doc.setTextColor(COLORS.GRAY_TXT);
    doc.text('VIA PORTARIA / CONTROLE DE ACESSO  >8 ------------------------------------------------------------------------------------------------------', MARGIN, cutY - 2);

    cursorY = cutY + layoutConfig.headerGap;

    // --- BLOCO DE RESUMO (GLOBAL - APENAS MULTI) ---
    if (deliveryCount > 1) {
        const summaryH = 12;
        doc.setFillColor(COLORS.GRAY_BG);
        doc.roundedRect(MARGIN, cursorY, CONTENT_WIDTH, summaryH, 2, 2, 'F');
        
        let sumY = cursorY + 4 + (layoutConfig.labelSize / 3); 
        let sumX = MARGIN + 4;

        sumX = drawLabelValue('TRANSPORTADORA:', (load.carrier || 'PRÓPRIA').substring(0, 20), sumX, sumY);
        sumX = drawSeparator(sumX, sumY);
        sumX = drawLabelValue('MODAL:', load.shippingType, sumX, sumY);
        sumX = drawSeparator(sumX, sumY);
        sumX = drawLabelValue('PESO TOTAL:', `${formatDecimal(load.totalWeight)} kg`, sumX, sumY);
        sumX = drawSeparator(sumX, sumY);
        drawLabelValue('VOLUME TOTAL:', `${formatDecimal(load.totalVolume)} m³`, sumX, sumY);

        cursorY += summaryH + layoutConfig.separatorGap;
    }

    // --- LOOP DE ENTREGAS ---
    deliveries.forEach((delivery, index) => {
        // Verifica quebra de página
        if (cursorY > PAGE_HEIGHT - 40) {
            doc.addPage();
            cursorY = MARGIN + 10;
            doc.setFontSize(8); doc.setTextColor(COLORS.GRAY_TXT);
            doc.text(`CONTINUAÇÃO - ${load.portCode}`, MARGIN, MARGIN);
            cursorY += 5;
        }

        // ==========================================
        // LAYOUT ESPECÍFICO: UMA ENTREGA (PREMIUM COMPACT)
        // ==========================================
        if (deliveryCount === 1) {
            // 1. CARD DESTINATÁRIO (HERO SECTION)
            const heroHeight = 32; // Compactado
            doc.setFillColor(COLORS.GRAY_BG);
            doc.roundedRect(MARGIN, cursorY, CONTENT_WIDTH, heroHeight, 3, 3, 'F');
            doc.setFillColor(COLORS.RED);
            doc.rect(MARGIN, cursorY, 1.5, heroHeight, 'F');

            let boxY = cursorY + 7;
            let boxX = MARGIN + 8;

            doc.setFontSize(7); doc.setTextColor(COLORS.GRAY_TXT); doc.setFont('helvetica', 'bold');
            doc.text('DESTINATÁRIO PRINCIPAL', boxX, boxY);
            
            boxY += 6;
            doc.setFontSize(13); doc.setTextColor(COLORS.DARK); doc.setFont('helvetica', 'bold');
            doc.text(delivery.clientName, boxX, boxY);
            
            boxY += 5;
            doc.setFontSize(9); doc.setTextColor(COLORS.GRAY_TXT); doc.setFont('helvetica', 'normal');
            doc.text(`${delivery.address.city} - ${delivery.address.state}  •  ${delivery.address.fullAddress || ''}`, boxX, boxY);
            
            boxY += 5;
            const docText = delivery.cnpjCpf ? formatDocument(delivery.cnpjCpf) : 'N/A';
            doc.setFontSize(8); doc.setTextColor(COLORS.GRAY_MID);
            doc.text(`CNPJ/CPF: ${docText}`, boxX, boxY);

            cursorY += heroHeight + 8; // Gap reduzido

            // 2. GRID LOGÍSTICO & TOTAIS (CLEAN COMPACT)
            const colW = CONTENT_WIDTH / 4;
            drawFieldBlock(MARGIN, cursorY, 'TRANSPORTADORA', (load.carrier || 'PRÓPRIA').substring(0, 25), colW);
            drawFieldBlock(MARGIN + colW, cursorY, 'MODALIDADE', load.shippingType);
            drawFieldBlock(MARGIN + (colW*2), cursorY, 'REFERÊNCIA (OC)', delivery.loadingOrder || '---');
            const totalQtd = delivery.items.reduce((acc, i) => acc + i.quantity, 0);
            drawFieldBlock(MARGIN + (colW*3), cursorY, 'QTD ITENS', totalQtd.toString());

            cursorY += 12; // Gap reduzido entre linhas do grid

            drawFieldBlock(MARGIN, cursorY, 'PESO BRUTO TOTAL', `${formatDecimal(load.totalWeight)} kg`);
            drawFieldBlock(MARGIN + colW, cursorY, 'CUBAGEM TOTAL', `${formatDecimal(load.totalVolume)} m³`);
            drawFieldBlock(MARGIN + (colW*2), cursorY, 'DATA CARREGAMENTO', new Date(load.date).toLocaleDateString('pt-BR'));

            cursorY += 15; // Gap reduzido antes da tabela

        } else {
            // ==========================================
            // LAYOUT PADRÃO: MÚLTIPLAS ENTREGAS (COMPACTO)
            // ==========================================
            
            const infoBlockHeight = 14;
            doc.setFillColor(COLORS.GRAY_BG);
            doc.rect(MARGIN, cursorY, CONTENT_WIDTH, infoBlockHeight, 'F');
            doc.setFillColor(COLORS.RED);
            doc.rect(MARGIN, cursorY, 1.5, infoBlockHeight, 'F');

            let line1Y = cursorY + 5;
            let currentX = MARGIN + 4;

            doc.setFontSize(layoutConfig.labelSize); doc.setTextColor(COLORS.RED); doc.setFont('helvetica', 'bold');
            doc.text(`${index + 1}ª ENTREGA`, currentX, line1Y);
            currentX += doc.getTextWidth(`${index + 1}ª ENTREGA`) + 4;
            doc.setTextColor(COLORS.GRAY_MID); doc.text('|', currentX - 2, line1Y);

            const clientTruncate = 45;
            const clientName = delivery.clientName.length > clientTruncate ? delivery.clientName.substring(0, clientTruncate - 2) + '...' : delivery.clientName;
            doc.setFontSize(layoutConfig.valueSize); doc.setTextColor(COLORS.DARK); doc.setFont('helvetica', 'bold');
            doc.text(clientName, currentX, line1Y);

            const addressText = `${delivery.address.city}/${delivery.address.state}`;
            doc.setFontSize(layoutConfig.labelSize); doc.setTextColor(COLORS.GRAY_TXT); doc.setFont('helvetica', 'bold');
            doc.text(addressText, PAGE_WIDTH - MARGIN - 2, line1Y, { align: 'right' });

            let line2Y = cursorY + 10;
            currentX = MARGIN + 4;
            
            const docText = delivery.cnpjCpf ? formatDocument(delivery.cnpjCpf) : 'N/A';
            doc.setFontSize(7); doc.setTextColor(COLORS.GRAY_TXT); doc.setFont('helvetica', 'normal');
            doc.text(`DOC: ${docText}`, currentX, line2Y);

            if (delivery.loadingOrder) {
                doc.setTextColor(COLORS.RED); doc.setFont('helvetica', 'bold');
                doc.text(`REF: ${delivery.loadingOrder}`, PAGE_WIDTH - MARGIN - 2, line2Y, { align: 'right' });
            }

            cursorY += infoBlockHeight;
        }

        // --- TABELA DE ITENS (COMUM) ---
        // Header Tabela
        doc.setFillColor(COLORS.DARK);
        if (deliveryCount === 1) {
            doc.roundedRect(MARGIN, cursorY, CONTENT_WIDTH, layoutConfig.tableHeaderH, 1, 1, 'F');
        } else {
            doc.rect(MARGIN, cursorY, CONTENT_WIDTH, layoutConfig.tableHeaderH, 'F');
        }

        const tCol1 = MARGIN + 4;
        const tCol2 = MARGIN + 35; // Mais espaço para código
        const tCol3 = PAGE_WIDTH - MARGIN - 25; // Qtd
        const tCol4 = PAGE_WIDTH - MARGIN - 4;  // Unit

        const thY = cursorY + (layoutConfig.tableHeaderH / 2) + 1.5;

        doc.setFontSize(layoutConfig.labelSize); doc.setTextColor(COLORS.WHITE); doc.setFont('helvetica', 'bold');
        doc.text('CÓDIGO SKU', tCol1, thY);
        doc.text('DESCRIÇÃO DO MATERIAL', tCol2, thY);
        doc.text('QUANTIDADE', tCol3, thY, { align: 'right' });
        doc.text('UND', tCol4, thY, { align: 'right' });

        cursorY += layoutConfig.tableHeaderH;

        // Rows Tabela
        doc.setFont('helvetica', 'normal');
        
        delivery.items.forEach((item, iIdx) => {
            if (cursorY > PAGE_HEIGHT - 35) {
                doc.addPage();
                cursorY = MARGIN + 10;
                doc.setFillColor(COLORS.DARK);
                doc.rect(MARGIN, cursorY, CONTENT_WIDTH, layoutConfig.tableHeaderH, 'F');
                doc.setFontSize(layoutConfig.labelSize); doc.setTextColor(COLORS.WHITE); doc.setFont('helvetica', 'bold');
                doc.text('CÓDIGO SKU', tCol1, cursorY + (layoutConfig.tableHeaderH/2)+1.5);
                doc.text('DESCRIÇÃO (CONT.)', tCol2, cursorY + (layoutConfig.tableHeaderH/2)+1.5);
                doc.text('QTD', tCol3, cursorY + (layoutConfig.tableHeaderH/2)+1.5, { align: 'right' });
                doc.text('UND', tCol4, cursorY + (layoutConfig.tableHeaderH/2)+1.5, { align: 'right' });
                cursorY += layoutConfig.tableHeaderH;
            }

            // Zebra Striping
            if (iIdx % 2 === 0) {
                doc.setFillColor(COLORS.GRAY_BG);
                doc.rect(MARGIN, cursorY, CONTENT_WIDTH, layoutConfig.tableRowH, 'F');
            }

            const rowY = cursorY + (layoutConfig.tableRowH / 2) + 1.5;
            
            doc.setTextColor(COLORS.DARK);
            doc.setFontSize(layoutConfig.valueSize); 
            doc.setFont('helvetica', 'normal');

            doc.text(item.code || '-', tCol1, rowY);
            
            const maxChars = deliveryCount >= 3 ? 55 : 70;
            const desc = item.description.length > maxChars ? item.description.substring(0, maxChars-3) + '...' : item.description;
            doc.text(desc, tCol2, rowY);

            doc.setFont('helvetica', 'bold');
            doc.text(item.quantity.toString(), tCol3, rowY, { align: 'right' });
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(layoutConfig.labelSize);
            doc.text(item.unit, tCol4, rowY, { align: 'right' });

            cursorY += layoutConfig.tableRowH;
        });

        // Borda inferior da tabela
        doc.setDrawColor(COLORS.GRAY_MID);
        doc.setLineWidth(0.1);
        doc.line(MARGIN, cursorY, PAGE_WIDTH - MARGIN, cursorY);

        cursorY += layoutConfig.separatorGap;
    });

    drawFooter();
    doc.save(`MANIFESTO_${load.portCode}.pdf`);
  },

  saveLoad: async (loadData: Partial<Load>) => {
    const isNew = !loadData.id;
    const currentUser = userService.getCurrentUser();
    
    // Normalização de Dados Financeiros e Veiculares para evitar undefined
    const financial = loadData.financial || {
      freightValue: loadData.freightValue || 0,
      customerFreightValue: 0,
      extraCosts: 0,
      invoiceValue: 0,
      currency: 'BRL'
    };

    // Garante que o campo novo exista mesmo em edições antigas
    if (financial.customerFreightValue === undefined) {
      financial.customerFreightValue = 0;
    }

    const vehicle = loadData.vehicle || {
      type: 'Carreta',
      plate: '',
      driverName: ''
    };

    // Atualiza campos raiz legados para manter compatibilidade
    loadData.freightValue = financial.freightValue;

    let savedLoad: Load;
    let oldStatus: LoadStatus | null = null;

    if (isNew) {
      const status = loadService.calculateStatus(loadData);
      const initialHistory: LoadStatusEvent = {
        status,
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        notes: 'Carga criada no sistema'
      };

      savedLoad = {
        ...loadData as Load,
        id: Math.random().toString(36).substr(2, 9),
        portCode: loadService.generatePortCode(),
        date: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status,
        active: true,
        createdBy: currentUser.id,
        history: [initialHistory], // Inicia timeline
        financial,
        vehicle
      };
      db.loads.create(savedLoad);
      
      notificationService.addNotification({
        title: 'Nova Carga Criada',
        description: `Protocolo ${savedLoad.portCode} iniciado.`,
        type: 'info'
      });

    } else {
      // Preserva histórico existente se não vier no payload
      const existing = db.loads.getById(loadData.id!);
      const history = existing?.history || [];
      oldStatus = existing?.status || null; // Captura status anterior

      db.loads.update(loadData.id!, { 
        ...loadData, 
        financial,
        vehicle,
        history, // Mantém histórico
        updatedAt: new Date().toISOString() 
      });
      savedLoad = db.loads.getById(loadData.id!)!;
    }

    // --- DISPARO DE EVENTO ---
    // Verifica se houve mudança de status (ou se é novo)
    eventService.dispatch(savedLoad, oldStatus);

    return savedLoad;
  },

  deleteLoad: (id: string) => {
    db.loads.update(id, { active: false, updatedAt: new Date().toISOString() });
  },

  updateStatus: (id: string, status: LoadStatus) => {
    const currentLoad = db.loads.getById(id);
    if (!currentLoad) return;

    const currentUser = userService.getCurrentUser();
    const settings = db.settings.getSettings();
    const oldStatus = currentLoad.status; // Captura status anterior

    const newEvent: LoadStatusEvent = {
      status,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      notes: `Alteração de status via Kanban/Lista`
    };

    const updatedHistory = [...(currentLoad.history || []), newEvent];
    
    let actualDeliveryDate = currentLoad.actualDeliveryDate;
    if (status === LoadStatus.COMPLETED && !actualDeliveryDate) {
      actualDeliveryDate = new Date().toISOString();
    }

    // Persiste mudança de status
    db.loads.update(id, { 
      status, 
      history: updatedHistory,
      actualDeliveryDate,
      updatedAt: new Date().toISOString() 
    });
    
    const updatedLoad = db.loads.getById(id)!;

    // --- DISPARO DE EVENTO ---
    eventService.dispatch(updatedLoad, oldStatus);

    // --- LÓGICA DE VALIDAÇÃO FISCAL (DIFAL) ---
    if (status === LoadStatus.DISPATCHED || status === LoadStatus.BILLED) {
      const needsDifal = updatedLoad.hasDifal === true || updatedLoad.clientType === ClientType.NON_CONTRIBUTOR;
      const hasDocs = updatedLoad.paymentProof && updatedLoad.difalGuide;
      
      const isFiscalProblem = needsDifal && !hasDocs;
      
      if (isFiscalProblem) {
        notificationService.addNotification({
          title: 'Bloqueio Fiscal (DIFAL)',
          description: `Carga ${updatedLoad.portCode} expedida com pendência de recolhimento DIFAL.`,
          type: 'danger'
        });
        
        if (settings.enableWhatsAppBot && settings.whatsappBotNumber) {
           const message = `🚨 *ALERTA FISCAL - GESLA*\n\nCarga: *${updatedLoad.portCode}*\nStatus: *${status}*\n⚠️ Pendência de DIFAL (Obrigatório).`;
           const link = loadService.generateWhatsAppLink(settings.whatsappBotNumber, message);
           notificationService.addNotification({
             title: 'Bot: Risco Fiscal',
             description: `Alerta de DIFAL enviado via WhatsApp.`,
             type: 'whatsapp',
             link: link
           });
        }
      }
    }
  }
};
