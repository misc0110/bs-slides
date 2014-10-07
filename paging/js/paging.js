var Paging = new function() {
  this.pdo = 0;
  this.pto = 0;
  this.offset = 0;
  this.bin = null;
  this.canvas = null;
  this.canvas_w = 0;
  this.canvas_h = 0;
  this.font_size = 12;
  
  // --------------------------------------------------------------------------
  this.addressChange = function() {
    Paging.parseAddress("addr");
    if(Paging.bin.length > 32) return;
    Paging.calculatePointer();
    Paging.showBinaryAddress("addr_bin");
    Paging.drawTables();
  };
  
  // --------------------------------------------------------------------------
  this.parseAddress = function(addr_field) {
    addr = parseInt(document.getElementById(addr_field).value, 16);
    console.log(addr);
    bin = [];
    tmp = addr;
    while(tmp > 0) {
      bin.unshift(tmp % 2);
      tmp = Math.floor(tmp / 2);
    }
    console.log(bin);
    Paging.bin = bin;
  };
  
  // --------------------------------------------------------------------------
  this.calculatePointer = function() {
    Paging.pdo = (Math.floor(addr / (1 << 22))); 
    Paging.pto = (Math.floor(addr / (1 << 12))) % (1 << 10);
    Paging.offset = (addr % (1 << 12));
  };
  
  // --------------------------------------------------------------------------
  this.showBinaryAddress = function(addr) {
    table = "<table><tr>";
    for(i = 31; i >= 0; i--) {
      if(i >= bin.length) val = 0; else val = bin[bin.length - 1 - i]; 
      if(i >= 22) col = "#77DD77";
      else if(i >= 12) col = "#FDFD96";
      else col = "#FFB347";
      table += "<td style=\"background-color: " + col + "; font-weight: bold; color: black; " + ((i % 8 == 0 && i) ? "border-right: 1px solid black; " : "") + "\">" + val + "</td>";
    }
    table += "</tr>";
    
    table += "<tr>";
    table += "<td colspan=\"10\" style=\"border-right: 1px solid black; font-weight: normal;\">Page Directory Offset: " + Paging.pdo + " (0x" + Paging.pdo.toString(16) + ")</td>";
    table += "<td colspan=\"10\" style=\"border-right: 1px solid black;\">Page Table Offset: " + Paging.pto + " (0x" + Paging.pto.toString(16) + ")</td>";
    table += "<td colspan=\"12\">Page Offset: " + Paging.offset + " (0x" + Paging.offset.toString(16) + ")</td>";
    
    table += "</tr>";
    
    table += "</table>";
    document.getElementById(addr).innerHTML = table;
  };
  
  // --------------------------------------------------------------------------
  this.drawTables = function() {
    canvas = document.getElementById("tables");
    ctx = canvas.getContext("2d");
    Paging.canvas = ctx;
    
    W = document.getElementsByTagName("slide")[1].offsetWidth - 100;
    H = 350;
    Paging.canvas_w = W;
    Paging.canvas_h = H;
    canvas.width = W;
    canvas.height = H + 8;
    
    
    //filling the canvas white
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, W, H);    
    
    margin = W * 0.1;
    table_w = W / 3 - 2 * margin;
    table_h = H * 0.9;
    
    pd_x = W / 6;
    pd_y = 8;
    
    pt_x = 2 * W / 3 - W / 6;
    pt_y = 8;
    
    p_x = W - W / 6;
    p_y = 8;
    
    cr_x = 8;
    cr_y = table_h;
    
    ctx.font = Paging.font_size + "pt Calibri";
    
    entry_height = Paging.font_size + 6;

    // CR3    
    ctx.fillStyle = "#ddd";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.moveTo(cr_x, cr_y);
    ctx.lineTo(cr_x, cr_y + entry_height);
    ctx.lineTo(cr_x + table_w / 2, cr_y + entry_height);
    ctx.lineTo(cr_x + table_w / 2, cr_y);
    ctx.lineTo(cr_x, cr_y);
    ctx.fill();
    ctx.stroke();
    dim = ctx.measureText("CR3");
    ctx.fillStyle = "black";
    ctx.fillText("CR3", cr_x + (table_w / 2 - dim.width) / 2, cr_y + entry_height - 4);
    
    ctx.strokeStyle = "green";
    ctx.beginPath();
    ctx.moveTo(cr_x + table_w / 2 - 12, cr_y + 8);
    ctx.arc(cr_x + table_w / 2 - 12, cr_y + 8, 2, 0, 2 * Math.PI, false);
    ctx.lineTo(pd_x, pd_y + table_h);
    ctx.lineWidth = 2;
    ctx.stroke();
    Paging.drawArrowHead(pd_x, pd_y + table_h, 4);
      
    Paging.drawTable(pd_x, pd_y, table_w, table_h, "page directory");
    Paging.drawTable(pt_x, pt_y, table_w, table_h, "page table");
    Paging.drawTable(p_x, p_y, table_w, table_h, "4k page");
    
    pde_y = pd_y + (table_h - entry_height) * (1023 - Paging.pdo) / 1024;
    
    Paging.drawEntry(pd_x, pde_y, table_w, entry_height, "32 bit PD entry", pd_x, pd_y, pt_x, pt_y + table_h);
    Paging.drawEntry(pt_x, pt_y + (table_h - entry_height) * (1023 - Paging.pto) / 1024, table_w, entry_height, "32 bit PT entry", pt_x, pt_y, p_x, p_y + table_h);
    Paging.drawEntry(p_x, p_y + (table_h - entry_height) * (4095 - Paging.offset) / 4096, table_w, entry_height, "data", p_x, p_y, -1, -1);
  };
  
  // --------------------------------------------------------------------------
  this.drawTable = function(x, y, w, h, name) {
    ctx = Paging.canvas;
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "black";
    dim = ctx.measureText(name);
    ctx.fillText(name, x + (w - dim.width) / 2, y + h + 12);
    ctx.fillText("4095 (0xfff)", x + w + 4, y + 4);
    ctx.fillText("0", x + w + 4, y + h + 4);
  };

  // --------------------------------------------------------------------------
  this.drawEntry = function(x, y, w, h, desc, top_x, top_y, point_x, point_y) {
    ctx = Paging.canvas;
    // border
    ctx.fillStyle = "#eee";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();
    // entry
    dim = ctx.measureText(desc);
    ctx.fillStyle = "black";
    ctx.fillText(desc, x + (w - dim.width) / 2, y + h - 4);
    // index pointer
    ctx.beginPath();
    ctx.moveTo(top_x - 32, top_y - 64);
    ctx.lineTo(top_x - 32, y + h);
    ctx.lineTo(x, y + h);
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.stroke();
    Paging.drawArrowHead(x, y + h, 4);
    // next pointer
    if(point_x != -1) {
      ctx.strokeStyle = "green";
      middle = x + (w + point_x - x) / 2;
      ctx.beginPath();
      ctx.moveTo(x + w - 12, y + h / 2);
      ctx.arc(x + w - 12, y + h / 2, 2, 0, 2 * Math.PI, false);
      ctx.lineTo(middle - 32, y + h / 2);
      ctx.lineTo(middle - 32, point_y);
      ctx.lineTo(point_x, point_y);
      ctx.stroke();
      Paging.drawArrowHead(point_x, point_y, 4);
    }
  };

  // --------------------------------------------------------------------------
  this.drawArrowHead = function(x, y, size) {
    ctx = Paging.canvas;
    ctx.beginPath();
    ctx.moveTo(x - 2 * size, y - size);
    ctx.lineTo(x, y);
    ctx.lineTo(x - 2 * size, y + size);
    ctx.lineTo(x - 2 * size, y - size);
    ctx.stroke();
  };
};


var PagingDetail = new function() {
  this.cr3 = 0;
  this.pde = 0;
  this.pte = 0;
  this.canvas = null;
  this.canvas_w = 0;
  this.canvas_h = 0;
  this.font_size = 11;
  
  // --------------------------------------------------------------------------
  this.addressChange = function() {
    Paging.parseAddress("addr1");
    if(Paging.bin.length > 32) return;
    Paging.calculatePointer();
    Paging.showBinaryAddress("addr_bin1");
  };
  
  // --------------------------------------------------------------------------
  this.resolve = function(generate) {
    generate = typeof generate !== 'undefined' ? generate : true;
    PagingDetail.addressChange();
    // generate random values for pages
    if(generate) {
      PagingDetail.cr3 = Math.abs(Math.floor(Math.random() * ((1 << 20)))) * 4096;
      PagingDetail.pde = Math.abs(Math.floor(Math.random() * ((1 << 20)))) * 4096 + 7;
      PagingDetail.pte = Math.abs(Math.floor(Math.random() * ((1 << 20)))) * 4096 + 7;
    }
    PagingDetail.initDraw();
    PagingDetail.drawPD();
    PagingDetail.drawPDE();
    document.getElementById("goto_pt").style.display = "block";
    document.getElementById("goto_pd").style.display = "none";
    document.getElementById("goto_p").style.display = "none";
    document.getElementById("goto_pt1").style.display = "none";    
  };

  // --------------------------------------------------------------------------
  this.resolve2 = function() {
    document.getElementById("goto_pt").style.display = "none";
    document.getElementById("goto_pt1").style.display = "none";
    document.getElementById("goto_pd").style.display = "block";
    document.getElementById("goto_p").style.display = "block";
    PagingDetail.initDraw();
    
    PagingDetail.drawPT();
    PagingDetail.drawPTE();
  };

  // --------------------------------------------------------------------------
  this.resolve3 = function() {
    document.getElementById("goto_pt").style.display = "none";
    document.getElementById("goto_pd").style.display = "none";
    document.getElementById("goto_p").style.display = "none";
    document.getElementById("goto_pt1").style.display = "block";
    
    PagingDetail.initDraw();
    PagingDetail.drawPage();
  };

  
  // --------------------------------------------------------------------------
  this.initDraw = function() {
    canvas = document.getElementById("tab1");
    ctx = canvas.getContext("2d");
    PagingDetail.canvas = ctx;
    
    W = document.getElementsByTagName("slide")[2].offsetWidth - 100;
    H = 350;
    PagingDetail.canvas_w = W;
    PagingDetail.canvas_h = H;
    canvas.width = W;
    canvas.height = H + 8;
    
    //filling the canvas white
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, W, H);    
    
    ctx.font = PagingDetail.font_size + "pt Calibri";
  };
  
  // --------------------------------------------------------------------------
  this.drawPD = function() {
    ctx = PagingDetail.canvas;
    W = PagingDetail.canvas_w;
    H = PagingDetail.canvas_h;
    
    pd_x = W / 4;
    pd_y = 64 + 32;
    pd_h = H - 128;
    pd_w = W / 6;
    
    pde_y = pd_y + (pd_h - entry_height) * (1023 - Paging.pdo) / 1024;
    
    cr_x = 8;
    cr_y = pd_y + pd_h
    cr_w = W / 6;
    
    entry_height = PagingDetail.font_size + 6;

    // CR3    
    ctx.fillStyle = "#ddd";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.moveTo(cr_x, cr_y);
    ctx.lineTo(cr_x, cr_y + entry_height);
    ctx.lineTo(cr_x + cr_w, cr_y + entry_height);
    ctx.lineTo(cr_x + cr_w, cr_y);
    ctx.lineTo(cr_x, cr_y);
    ctx.fill();
    ctx.stroke();
    cr_addr = "0x" + PagingDetail.cr3.toString(16).toUpperCase();
    dim = ctx.measureText(cr_addr);
    ctx.fillStyle = "black";
    ctx.fillText("CR3", cr_x + 4, cr_y - 8);
    ctx.fillText(cr_addr, cr_x + (cr_w - dim.width) / 2, cr_y + entry_height - 4);
    
    // PD
    ctx.beginPath();
    ctx.moveTo(pd_x, pd_y - 64);
    ctx.lineTo(pd_x, pd_y + pd_h + 64);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pd_x + pd_w, pd_y - 64);
    ctx.lineTo(pd_x + pd_w, pd_y + pd_h + 64);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pd_x, pd_y);
    ctx.lineTo(pd_x + pd_w, pd_y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pd_x, pd_y + pd_h);
    ctx.lineTo(pd_x + pd_w, pd_y + pd_h);
    ctx.stroke();
    
    // PD addresses
    ctx.fillText(cr_addr, pd_x + pd_w + 4, pd_y + pd_h);
    ctx.fillText("0x" + (PagingDetail.cr3 + 4096).toString(16).toUpperCase(), pd_x + pd_w + 4, pd_y);
    
    // CR3 pointer
    ctx.strokeStyle = "green";
    ctx.beginPath();
    ctx.moveTo(cr_x + cr_w - 12, cr_y + entry_height / 2);
    ctx.arc(cr_x + cr_w - 12, cr_y + entry_height / 2, 2, 0, 2 * Math.PI, false);
    ctx.lineTo(pd_x, pd_y + pd_h);
    ctx.stroke();
    PagingDetail.drawArrowHead(pd_x, pd_y + pd_h, 4);
    
    // PD entry
    ctx.strokeStyle = "black";
    ctx.fillStyle = "#ddd";
    ctx.beginPath();
    ctx.moveTo(pd_x, pde_y);
    ctx.lineTo(pd_x + pd_w, pde_y);
    ctx.lineTo(pd_x + pd_w, pde_y + entry_height);
    ctx.lineTo(pd_x, pde_y + entry_height);
    ctx.fill();
    ctx.stroke();
    pde_str = "0x" + PagingDetail.pde.toString(16).toUpperCase();
    ctx.fillStyle = "black";
    dim = ctx.measureText(pde_str);
    ctx.fillText(pde_str, pd_x + (pd_w - dim.width) / 2, pde_y + entry_height - 4);
    ctx.fillText("0x" + (Paging.pdo * 4 + PagingDetail.cr3).toString(16).toUpperCase(), pd_x + pd_w + 4, pde_y + entry_height);
    
    // pointer to PD entry
    ctx.beginPath();
    ctx.moveTo(pd_x - 32, pd_y - 64);
    ctx.lineTo(pd_x - 32, pde_y + entry_height);
    ctx.lineTo(pd_x, pde_y + entry_height);
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.stroke();
    PagingDetail.drawArrowHead(pd_x, pde_y + entry_height, 4);
    ctx.fillStyle = "blue";
    
    ptr = "0x" + ((PagingDetail.cr3 + 4 * Paging.pdo).toString(16).toUpperCase());
    dim = ctx.measureText(ptr);
    ctx.fillText(ptr, pd_x - dim.width - 8 - 32, pd_y);
    
    ptr = "(0x" + (PagingDetail.cr3).toString(16).toUpperCase() + " + 4 * 0x" + (Paging.pdo.toString(16).toUpperCase() + ")");
    dim = ctx.measureText(ptr);
    ctx.fillText(ptr, pd_x - dim.width - 8 - 32, pd_y + entry_height);
  };

  // --------------------------------------------------------------------------
  this.drawPDE = function() {
    bin = [];
    tmp = PagingDetail.pde;
    while(tmp > 0) {
      bin.unshift(tmp % 2);
      tmp = Math.floor(tmp / 2);
    }
    while(bin.length < 32) bin.unshift(0);
    console.log(bin);
    
    flag_x = W / 2 - 8;
    flag_y = 32;

    entry_height = PagingDetail.font_size + 6;
    margin = entry_height * 3 / 4;
    
    ctx.fillStyle = "black";
    ctx.fillText("PD Entry:", flag_x, flag_y - 16);
    for(i = 0; i < 32; i++) {
      ctx.fillText(bin[i], flag_x + i * margin, flag_y - 16 + entry_height);
    }
    ctx.beginPath();
    ctx.strokeStyle = "green";
    ctx.moveTo(flag_x - 4, flag_y);
    ctx.lineTo(flag_x - 4, flag_y + 12);
    ctx.lineTo(flag_x + 20 * margin - 5, flag_y + 12);
    ctx.lineTo(flag_x + 20 * margin - 5, flag_y);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.strokeStyle = "brown";
    ctx.moveTo(flag_x + 20 * margin - 3, flag_y);
    ctx.lineTo(flag_x + 20 * margin - 3, flag_y + 12);
    ctx.lineTo(flag_x + 32 * margin, flag_y + 12);
    ctx.lineTo(flag_x + 32 * margin, flag_y);
    ctx.stroke();
    
    ctx.fillText("Page Table Address (0x" + (Math.floor(PagingDetail.pde / 4096) * 4096).toString(16).toUpperCase() + ")", flag_x + 12, flag_y + 8 + entry_height);
    ctx.fillText("Flags", flag_x + 20 * margin + 12, flag_y + 8 + entry_height);
    ctx.fillText("(Present, R/W, User)", flag_x + 20 * margin + 12, flag_y + 8 + entry_height * 2);
  };


  // --------------------------------------------------------------------------
  this.drawPT = function() {
    ctx = PagingDetail.canvas;
    W = PagingDetail.canvas_w;
    H = PagingDetail.canvas_h;

    entry_height = PagingDetail.font_size + 6;
    margin = entry_height * 3 / 4;

    pt_x = W / 2 + W / 16;
    pt_y = 64 + 32;
    pt_h = H - 128;
    pt_w = W / 6;
    pt_base = Math.floor(PagingDetail.pde / 4096) * 4096;
    
    pte_y = pt_y + (pt_h - entry_height) * (1023 - Paging.pto) / 1024;
    
    pde_x = W / 4;
    pde_y = pt_y + pt_h
    pde_w = W / 6;
    
    // PDE    
    ctx.fillStyle = "#ddd";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.moveTo(pde_x, pde_y);
    ctx.lineTo(pde_x, pde_y + entry_height);
    ctx.lineTo(pde_x + pde_w, pde_y + entry_height);
    ctx.lineTo(pde_x + pde_w, pde_y);
    ctx.lineTo(pde_x, pde_y);
    ctx.fill();
    ctx.stroke();
    pt_addr = "0x" + pt_base.toString(16).toUpperCase();
    dim = ctx.measureText(pt_addr);
    ctx.fillStyle = "black";
    ctx.fillText("PDE", pde_x + 4, pde_y - 8);
    ctx.fillText(pt_addr, pde_x + (pde_w - dim.width) / 2, pde_y + entry_height - 4);
    
    // PD
    ctx.beginPath();
    ctx.moveTo(pt_x, pt_y - 64);
    ctx.lineTo(pt_x, pt_y + pt_h + 64);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pt_x + pt_w, pt_y - 64);
    ctx.lineTo(pt_x + pt_w, pt_y + pt_h + 64);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pt_x, pt_y);
    ctx.lineTo(pt_x + pt_w, pt_y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pt_x, pt_y + pt_h);
    ctx.lineTo(pt_x + pt_w, pt_y + pt_h);
    ctx.stroke();
    
    // PD addresses
    ctx.fillText(pt_addr, pt_x + pt_w + 4, pt_y + pt_h);
    ctx.fillText("0x" + (pt_base + 4096).toString(16).toUpperCase(), pt_x + pt_w + 4, pt_y);
    
    // CR3 pointer
    ctx.strokeStyle = "green";
    ctx.beginPath();
    ctx.moveTo(pde_x + pde_w - 12, pde_y + entry_height / 2);
    ctx.arc(pde_x + pde_w - 12, pde_y + entry_height / 2, 2, 0, 2 * Math.PI, false);
    ctx.lineTo(pt_x, pt_y + pt_h);
    ctx.stroke();
    PagingDetail.drawArrowHead(pt_x, pt_y + pt_h, 4);
    
    // PD entry
    ctx.strokeStyle = "black";
    ctx.fillStyle = "#ddd";
    ctx.beginPath();
    ctx.moveTo(pt_x, pte_y);
    ctx.lineTo(pt_x + pt_w, pte_y);
    ctx.lineTo(pt_x + pt_w, pte_y + entry_height);
    ctx.lineTo(pt_x, pte_y + entry_height);
    ctx.fill();
    ctx.stroke();
    pde_str = "0x" + PagingDetail.pte.toString(16).toUpperCase();
    ctx.fillStyle = "black";
    dim = ctx.measureText(pde_str);
    ctx.fillText(pde_str, pt_x + (pt_w - dim.width) / 2, pte_y + entry_height - 4);
    ctx.fillText("0x" + (Paging.pto * 4 + pt_base).toString(16).toUpperCase(), pt_x + pt_w + 4, pte_y + entry_height);
    // pointer to PD entry
    ctx.beginPath();
    ctx.moveTo(pt_x - 32, pt_y - 64);
    ctx.lineTo(pt_x - 32, pte_y + entry_height);
    ctx.lineTo(pt_x, pte_y + entry_height);
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.stroke();
    PagingDetail.drawArrowHead(pt_x, pte_y + entry_height, 4);
    ctx.fillStyle = "blue";
    
    ptr = "0x" + ((pt_base + 4 * Paging.pto).toString(16).toUpperCase());
    dim = ctx.measureText(ptr);
    ctx.fillText(ptr, pt_x - dim.width - 8 - 32, pt_y);
    
    ptr = "(0x" + pt_base.toString(16).toUpperCase() + " + 4 * 0x" + (Paging.pto.toString(16).toUpperCase() + ")");
    dim = ctx.measureText(ptr);
    ctx.fillText(ptr, pt_x - dim.width - 8 - 32, pt_y + entry_height);
  };


  // --------------------------------------------------------------------------
  this.drawPTE = function() {
    bin = [];
    tmp = PagingDetail.pte;
    while(tmp > 0) {
      bin.unshift(tmp % 2);
      tmp = Math.floor(tmp / 2);
    }
    while(bin.length < 32) bin.unshift(0);
    console.log(bin);
    
    flag_x = 8;
    flag_y = 24 + 8;
    entry_height = PagingDetail.font_size + 6;
    margin = entry_height * 3 / 4;
    
    ctx.fillStyle = "black";
    ctx.fillText("PT Entry:", flag_x, flag_y - 16);
    for(i = 0; i < 32; i++) {
      ctx.fillText(bin[i], flag_x + i * margin, flag_y + entry_height - 16);
    }
    ctx.beginPath();
    ctx.strokeStyle = "green";
    ctx.moveTo(flag_x - 4, flag_y);
    ctx.lineTo(flag_x - 4, flag_y + 12);
    ctx.lineTo(flag_x + 20 * margin - 5, flag_y + 12);
    ctx.lineTo(flag_x + 20 * margin - 5, flag_y);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.strokeStyle = "brown";
    ctx.moveTo(flag_x + 20 * margin - 3, flag_y);
    ctx.lineTo(flag_x + 20 * margin - 3, flag_y + 12);
    ctx.lineTo(flag_x + 32 * margin, flag_y + 12);
    ctx.lineTo(flag_x + 32 * margin, flag_y);
    ctx.stroke();
    
    ctx.fillText("Page Address (0x" + (Math.floor(PagingDetail.pte / 4096) * 4096).toString(16).toUpperCase() + ")", flag_x + 12, flag_y + 8 + entry_height);
    ctx.fillText("Flags", flag_x + 20 * margin + 12, flag_y + 8 + entry_height);
    ctx.fillText("(Present, R/W, User)", flag_x + 20 * margin + 12, flag_y + 8 + entry_height * 2);
  };


  // --------------------------------------------------------------------------
  this.drawPage = function() {
    ctx = PagingDetail.canvas;
    W = PagingDetail.canvas_w;
    H = PagingDetail.canvas_h;
    
    entry_height = PagingDetail.font_size + 6;

    p_x = W / 2 + W / 4;
    p_y = 64;
    p_h = H - 128;
    p_w = W / 6;
    p_base = Math.floor(PagingDetail.pte / 4096) * 4096;
    
    pe_y = p_y + (p_h - entry_height) * (4095 - Paging.offset) / 4096;
    
    pte_x = W / 3;
    pte_y = p_y + p_h
    pte_w = W / 6;
    
    // PDE    
    ctx.fillStyle = "#ddd";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.moveTo(pte_x, pte_y);
    ctx.lineTo(pte_x, pte_y + entry_height);
    ctx.lineTo(pte_x + pte_w, pte_y + entry_height);
    ctx.lineTo(pte_x + pte_w, pte_y);
    ctx.lineTo(pte_x, pte_y);
    ctx.fill();
    ctx.stroke();
    pt_addr = "0x" + p_base.toString(16).toUpperCase();
    dim = ctx.measureText(pt_addr);
    ctx.fillStyle = "black";
    ctx.fillText("PTE", pte_x + 4, pte_y - 8);
    ctx.fillText(pt_addr, pte_x + (pte_w - dim.width) / 2, pte_y + entry_height - 4);
    
    // PD
    ctx.beginPath();
    ctx.moveTo(p_x, p_y - 64);
    ctx.lineTo(p_x, p_y + p_h + 64);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p_x + p_w, p_y - 64);
    ctx.lineTo(p_x + p_w, p_y + p_h + 64);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p_x, p_y);
    ctx.lineTo(p_x + p_w, p_y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p_x, p_y + p_h);
    ctx.lineTo(p_x + p_w, p_y + p_h);
    ctx.stroke();
    
    // PD addresses
    ctx.fillText(pt_addr, p_x + p_w + 4, p_y + p_h);
    ctx.fillText("0x" + (p_base + 4096).toString(16).toUpperCase(), p_x + p_w + 4, p_y);
    
    // CR3 pointer
    ctx.strokeStyle = "green";
    ctx.beginPath();
    ctx.moveTo(pte_x + pte_w - 12, pte_y + entry_height / 2);
    ctx.arc(pte_x + pte_w - 12, pte_y + entry_height / 2, 2, 0, 2 * Math.PI, false);
    ctx.lineTo(p_x, p_y + p_h);
    ctx.stroke();
    PagingDetail.drawArrowHead(p_x, p_y + p_h, 4);
    
    // PD entry
    ctx.strokeStyle = "black";
    ctx.fillStyle = "#ddd";
    ctx.beginPath();
    ctx.moveTo(p_x, pe_y);
    ctx.lineTo(p_x + p_w, pe_y);
    ctx.lineTo(p_x + p_w, pe_y + entry_height);
    ctx.lineTo(p_x, pe_y + entry_height);
    ctx.fill();
    ctx.stroke();
    pte_str = "<8 bit data>"; //"0x" + PagingDetail.pte.toString(16).toUpperCase();
    ctx.fillStyle = "black";
    dim = ctx.measureText(pte_str);
    ctx.fillText(pte_str, p_x + (p_w - dim.width) / 2, pe_y + entry_height - 4);
    ctx.fillText("0x" + (Paging.offset + p_base).toString(16).toUpperCase(), p_x + p_w + 4, pe_y + entry_height);
    // pointer to PD entry
    ctx.beginPath();
    ctx.moveTo(p_x - 32, p_y - 64);
    ctx.lineTo(p_x - 32, pe_y + entry_height);
    ctx.lineTo(p_x, pe_y + entry_height);
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.stroke();
    PagingDetail.drawArrowHead(p_x, pe_y + entry_height, 4);
    ctx.fillStyle = "blue";
    
    ptr = "0x" + ((p_base + Paging.offset).toString(16).toUpperCase());
    dim = ctx.measureText(ptr);
    ctx.fillText(ptr, p_x - dim.width - 8 - 32, p_y);
    
    ptr = "(0x" + p_base.toString(16).toUpperCase() + " + 0x" + (Paging.offset.toString(16).toUpperCase() + ")");
    dim = ctx.measureText(ptr);
    ctx.fillText(ptr, p_x - dim.width - 8 - 32, p_y + entry_height);
  };
  
  // --------------------------------------------------------------------------
  this.drawArrowHead = function(x, y, size) {
    ctx = PagingDetail.canvas;
    ctx.beginPath();
    ctx.moveTo(x - 2 * size, y - size);
    ctx.lineTo(x, y);
    ctx.lineTo(x - 2 * size, y + size);
    ctx.lineTo(x - 2 * size, y - size);
    ctx.stroke();
  };
};
