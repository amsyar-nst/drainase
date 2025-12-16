import { LaporanDrainase, KegiatanDrainase, AktifitasPenangananDetail } from "@/types/laporan";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export const generatePDFBulanan = async (data: LaporanDrainase, downloadNow: boolean = true): Promise<Blob> => {
  const getBase64 = async (file: File | string | null): Promise<string> => {
    return new Promise(async (resolve) => {
      if (!file) {
        resolve("");
        return;
      }
      if (typeof file === 'string') {
        try {
          const response = await fetch(file);
          if (!response.ok) throw new Error(`Failed to fetch image from URL: ${file}`);
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        } catch (error) {
          console.error("Error converting URL to base64:", error);
          resolve("");
        }
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const kegiatansWithImages = await Promise.all(
    data.kegiatans.map(async (kegiatan) => ({
      ...kegiatan,
      aktifitasPenangananDetails: await Promise.all(
        kegiatan.aktifitasPenangananDetails.map(async (detail) => ({
          ...detail,
          foto0Base64: await Promise.all(detail.foto0.map(f => getBase64(f))),
          foto50Base64: await Promise.all(detail.foto50.map(f => getBase64(f))),
          foto100Base64: await Promise.all(detail.foto100.map(f => getBase64(f))),
        }))
      ),
    }))
  );

  // Calculate totals
  let totalPanjangPenanganan = 0;
  let totalVolumeGalian = 0;
  let totalDexlite = 0;
  let totalPertalite = 0;
  let totalBioSolar = 0;

  kegiatansWithImages.forEach(kegiatan => {
    totalPanjangPenanganan += parseFloat(kegiatan.panjangPenanganan.replace(',', '.')) || 0;
    totalVolumeGalian += parseFloat(kegiatan.volumeGalian.replace(',', '.')) || 0;
    
    kegiatan.operasionalAlatBerats.forEach(op => {
      totalDexlite += parseFloat(op.dexliteJumlah.replace(',', '.')) || 0;
      totalPertalite += parseFloat(op.pertaliteJumlah.replace(',', '.')) || 0;
      totalBioSolar += parseFloat(op.bioSolarJumlah.replace(',', '.')) || 0;
    });
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Laporan Bulanan Drainase - ${data.periode}</title>
      <style>
        @page {
          size: A3 landscape;
          margin: 10mm;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          font-size: 7pt;
          line-height: 1.2;
          color: #000;
          margin: 0;
          padding: 0;
        }

        .header {
          text-align: center;
          margin-bottom: 5px;
        }

        .header .office {
          margin: 2px 0;
          font-size: 9pt;
          font-weight: bold;
          color: #000;
        }

        .header .address {
          margin: 2px 0;
          font-size: 7pt;
          color: #000;
        }

        .report-title {
          text-align: center;
          font-size: 9pt;
          font-weight: bold;
          margin: 5px 0 10px 0;
          text-transform: uppercase;
        }

        .period {
          margin-bottom: 10px;
          font-size: 8pt;
          font-weight: bold;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        table th {
          background-color: #f0f0f0;
          padding: 4px 3px;
          text-align: center;
          font-weight: bold;
          border: 1px solid #000;
          font-size: 6pt;
          vertical-align: middle;
        }

        table td {
          padding: 3px;
          border: 1px solid #000;
          font-size: 6pt;
          vertical-align: top;
        }

        .photo-cell {
          width: 100px;
          text-align: center;
          padding: 2px;
        }

        .photo-container {
          display: flex;
          flex-wrap: wrap;
          gap: 2px;
          justify-content: center;
        }

        .photo-container img {
          width: 45px;
          height: 34px;
          object-fit: cover;
          border: 1px solid #ccc;
        }

        ul {
          margin: 0;
          padding: 0;
          list-style: none;
        }
        li {
          margin: 0;
          padding: 0;
          line-height: 1.1;
        }

        .center {
          text-align: center;
        }

        .no-col { width: 20px; }
        .date-col { width: 70px; }
        .location-col { width: 150px; }
        .jenis-saluran-col { width: 50px; }
        .jenis-sedimen-col { width: 50px; }
        .uraian-kegiatan-col { width: 80px; }
        .panjang-col { width: 40px; }
        .volume-col { width: 40px; }
        .material-jenis-col { width: 130px; }
        .material-jumlah-col { width: 30px; }
        .material-satuan-col { width: 30px; }
        .material-keterangan-col { width: 50px; }
        .peralatan-jenis-col { width: 130px; }
        .peralatan-jumlah-col { width: 30px; }
        .peralatan-satuan-col { width: 30px; }
        .op-jenis-col { width: 100px; }
        .op-jumlah-col { width: 30px; }
        .op-fuel-col { width: 30px; }
        .op-fuel-satuan-col { width: 30px; }
        .op-keterangan-col { width: 60px; }
        .koordinator-col { width: 70px; }
        .phl-col { width: 30px; }
        .keterangan-akhir-col { width: 60px; }

        .total-row td {
          font-weight: bold;
          background-color: #e0e0e0;
        }

        @media print {
          body {
            padding: 0;
          }
          @page {
            size: A3 landscape;
            margin: 10mm;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="office">LAPORAN PELAKSANAAN PEKERJAAN PEMELIHARAAN DRAINASE</div>
        <div class="office">UPT OPJD MEDAN KOTA</div>
        <div class="address">DINAS SUMBER DAYA AIR BINA MARGA DAN BINA KONSTRUKSI KOTA MEDAN</div>
        <div class="address">SUMBER DAYA AIR</div>
      </div>

      <div class="period">Periode : ${data.periode}</div>

      <table>
        <thead>
          <tr>
            <th rowspan="3" class="no-col">NO</th>
            <th rowspan="3" class="date-col">HARI/<br/>TANGGAL</th>
            <th rowspan="3" class="location-col">LOKASI</th>
            <th colspan="3">FOTO DOKUMENTASI</th>
            <th rowspan="3" class="jenis-saluran-col">JENIS SALURAN<br/>(TERBUKA/<br/>TERTUTUP)</th>
            <th rowspan="3" class="jenis-sedimen-col">JENIS SEDIMEN<br/>(BATU/PADAT/<br/>CAIR)</th>
            <th rowspan="3" class="uraian-kegiatan-col">URAIAN KEGIATAN</th>
            <!-- Removed colspan="2" VOLUME header -->
            <th colspan="4">BAHAN MATERIAL</th>
            <th colspan="3">PERALATAN</th>
            <th colspan="9">OPERASIONAL ALAT BERAT</th>
            <th colspan="2">JUMLAH PERSONIL</th>
            <th rowspan="3" class="keterangan-akhir-col">KETERANGAN</th>
          </tr>
          <tr>
            <th rowspan="2" class="photo-cell">0%</th>
            <th rowspan="2" class="photo-cell">50%</th>
            <th rowspan="2" class="photo-cell">100%</th>
            <th rowspan="3" class="panjang-col">PANJANG<br/>(M)</th> <!-- Changed rowspan to 3 -->
            <th rowspan="3" class="volume-col">(M³)</th> <!-- Changed rowspan to 3 -->
            <th rowspan="2" class="material-jenis-col">JENIS</th>
            <th rowspan="2" class="material-jumlah-col">JUMLAH</th>
            <th rowspan="2" class="material-satuan-col">SATUAN</th>
            <th rowspan="2" class="material-keterangan-col">KETERANGAN</th>
            <th rowspan="2" class="peralatan-jenis-col">JENIS</th>
            <th rowspan="2" class="peralatan-jumlah-col">JUMLAH</th>
            <th rowspan="2" class="peralatan-satuan-col">SATUAN</th>
            <th rowspan="2" class="op-jenis-col">JENIS</th>
            <th rowspan="2" class="op-jumlah-col">JUMLAH</th>
            <th colspan="6">JENIS BAHAN BAKAR</th>
            <th rowspan="2" class="op-keterangan-col">KETERANGAN</th>
            <th rowspan="2" class="koordinator-col">KOORDINATOR</th>
            <th rowspan="2" class="phl-col">PHL</th>
          </tr>
          <tr>
            <th class="op-fuel-col">DEXLITE</th>
            <th class="op-fuel-satuan-col">SATUAN</th>
            <th class="op-fuel-col">PERTALITE</th>
            <th class="op-fuel-satuan-col">SATUAN</th>
            <th class="op-fuel-col">BIO SOLAR</th>
            <th class="op-fuel-satuan-col">SATUAN</th>
          </tr>
        </thead>
        <tbody>
          ${kegiatansWithImages.map((kegiatan, kegiatanIndex) => `
            ${kegiatan.aktifitasPenangananDetails.map((detail, detailIndex) => `
              <tr>
                ${detailIndex === 0 ? `
                  <td class="center" rowspan="${kegiatan.aktifitasPenangananDetails.length}">${kegiatanIndex + 1}</td>
                  <td rowspan="${kegiatan.aktifitasPenangananDetails.length}">${kegiatan.hariTanggal ? format(kegiatan.hariTanggal, "EEEE", { locale: id }) : ''}<br/>${kegiatan.hariTanggal ? format(kegiatan.hariTanggal, "dd/MM/yyyy", { locale: id }) : ''}</td>
                  <td rowspan="${kegiatan.aktifitasPenangananDetails.length}">${kegiatan.namaJalan}<br/>Kel. ${kegiatan.kelurahan}<br/>Kec. ${kegiatan.kecamatan}</td>
                ` : ''}
                <td class="photo-cell">
                  <div class="photo-container">
                    ${detail.foto0Base64.map(base64 => base64 ? `<img src="${base64}" alt="Foto 0%" />` : '').join('')}
                  </div>
                </td>
                <td class="photo-cell">
                  <div class="photo-container">
                    ${detail.foto50Base64.map(base64 => base64 ? `<img src="${base64}" alt="Foto 50%" />` : '').join('')}
                  </div>
                </td>
                <td class="photo-cell">
                  <div class="photo-container">
                    ${detail.foto100Base64.map(base64 => base64 ? `<img src="${base64}" alt="Foto 100%" />` : '').join('')}
                  </div>
                </td>
                <td class="center">${detail.jenisSaluran || '-'}</td>
                <td class="center">${detail.jenisSedimen || '-'}</td>
                <td>${detail.aktifitasPenanganan}</td>
                <td class="center">${kegiatan.panjangPenanganan || '-'}</td>
                <td class="center">${kegiatan.volumeGalian || '-'}</td>
                <td>
                  <ul class="material-list">
                    ${detail.materials.filter(m => m.jenis).map(material => `
                      <li>${material.jenis}</li>
                    `).join('')}
                  </ul>
                </td>
                <td class="center">
                  <ul class="material-list">
                    ${detail.materials.filter(m => m.jenis).map(material => `
                      <li>${material.jumlah}</li>
                    `).join('')}
                  </ul>
                </td>
                <td class="center">
                  <ul class="material-list">
                    ${detail.materials.filter(m => m.jenis).map(material => `
                      <li>${material.satuan}</li>
                    `).join('')}
                  </ul>
                </td>
                <td>
                  <ul class="material-list">
                    ${detail.materials.filter(m => m.jenis).map(material => `
                      <li>${material.keterangan || '-'}</li>
                    `).join('')}
                  </ul>
                </td>
                ${detailIndex === 0 ? `
                  <td rowspan="${kegiatan.aktifitasPenangananDetails.length}">
                    <ul class="equipment-list">
                      ${kegiatan.peralatans.filter(p => p.nama).map(peralatan => `
                        <li>${peralatan.nama}</li>
                      `).join('')}
                    </ul>
                  </td>
                  <td class="center" rowspan="${kegiatan.aktifitasPenangananDetails.length}">
                    <ul class="equipment-list">
                      ${kegiatan.peralatans.filter(p => p.nama).map(peralatan => `
                        <li>${peralatan.jumlah}</li>
                      `).join('')}
                    </ul>
                  </td>
                  <td class="center" rowspan="${kegiatan.aktifitasPenangananDetails.length}">
                    <ul class="equipment-list">
                      ${kegiatan.peralatans.filter(p => p.nama).map(peralatan => `
                        <li>${peralatan.satuan || '-'}</li>
                      `).join('')}
                    </ul>
                  </td>
                  <td rowspan="${kegiatan.aktifitasPenangananDetails.length}">
                    <ul class="equipment-list">
                      ${kegiatan.operasionalAlatBerats.filter(o => o.jenis).map(op => `
                        <li>${op.jenis}</li>
                      `).join('')}
                    </ul>
                  </td>
                  <td class="center" rowspan="${kegiatan.aktifitasPenangananDetails.length}">
                    <ul class="equipment-list">
                      ${kegiatan.operasionalAlatBerats.filter(o => o.jenis).map(op => `
                        <li>${op.jumlah}</li>
                      `).join('')}
                    </ul>
                  </td>
                  <td class="center" rowspan="${kegiatan.aktifitasPenangananDetails.length}">
                    <ul class="equipment-list">
                      ${kegiatan.operasionalAlatBerats.filter(o => o.jenis).map(op => `
                        <li>${op.dexliteJumlah || '-'}</li>
                      `).join('')}
                    </ul>
                  </td>
                  <td class="center" rowspan="${kegiatan.aktifitasPenangananDetails.length}">
                    <ul class="equipment-list">
                      ${kegiatan.operasionalAlatBerats.filter(o => o.jenis).map(op => `
                        <li>${op.dexliteSatuan || '-'}</li>
                      `).join('')}
                    </ul>
                  </td>
                  <td class="center" rowspan="${kegiatan.aktifitasPenangananDetails.length}">
                    <ul class="equipment-list">
                      ${kegiatan.operasionalAlatBerats.filter(o => o.jenis).map(op => `
                        <li>${op.pertaliteJumlah || '-'}</li>
                      `).join('')}
                    </ul>
                  </td>
                  <td class="center" rowspan="${kegiatan.aktifitasPenangananDetails.length}">
                    <ul class="equipment-list">
                      ${kegiatan.operasionalAlatBerats.filter(o => o.jenis).map(op => `
                        <li>${op.pertaliteSatuan || '-'}</li>
                      `).join('')}
                    </ul>
                  </td>
                  <td class="center" rowspan="${kegiatan.aktifitasPenangananDetails.length}">
                    <ul class="equipment-list">
                      ${kegiatan.operasionalAlatBerats.filter(o => o.jenis).map(op => `
                        <li>${op.bioSolarJumlah || '-'}</li>
                      `).join('')}
                    </ul>
                  </td>
                  <td class="center" rowspan="${kegiatan.aktifitasPenangananDetails.length}">
                    <ul class="equipment-list">
                      ${kegiatan.operasionalAlatBerats.filter(o => o.jenis).map(op => `
                        <li>${op.bioSolarSatuan || '-'}</li>
                      `).join('')}
                    </ul>
                  </td>
                  <td rowspan="${kegiatan.aktifitasPenangananDetails.length}">
                    <ul class="equipment-list">
                      ${kegiatan.operasionalAlatBerats.filter(o => o.jenis).map(op => `
                        <li>${op.keterangan || '-'}</li>
                      `).join('')}
                    </ul>
                  </td>
                  <td rowspan="${kegiatan.aktifitasPenangananDetails.length}">${kegiatan.koordinator.join(', ')}</td>
                  <td class="center" rowspan="${kegiatan.aktifitasPenangananDetails.length}">${kegiatan.jumlahPHL || '-'}</td>
                  <td rowspan="${kegiatan.aktifitasPenangananDetails.length}">${kegiatan.keterangan || ''}</td>
                ` : ''}
              </tr>
            `).join('')}
          `).join('')}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="9" style="text-align: right;">TOTAL</td>
            <td class="center">${totalPanjangPenanganan.toFixed(2).replace('.', ',')}</td>
            <td class="center">${totalVolumeGalian.toFixed(2).replace('.', ',')}</td>
            <td colspan="9"></td> <!-- Adjusted colspan for Material and Peralatan, and Jenis/Jumlah Operasional Alat Berat -->
            <td class="center">${totalDexlite.toFixed(2).replace('.', ',')}</td>
            <td class="center">Liter</td>
            <td class="center">${totalPertalite.toFixed(2).replace('.', ',')}</td>
            <td class="center">Liter</td>
            <td class="center">${totalBioSolar.toFixed(2).replace('.', ',')}</td>
            <td class="center">Liter</td>
            <td colspan="4"></td> <!-- Adjusted colspan for Keterangan Operasional, Koordinator, PHL, and Keterangan Akhir -->
          </tr>
        </tfoot>
      </table>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  
  if (downloadNow) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      throw new Error("Popup blocked. Please allow popups for this site.");
    }
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
  
  return blob;
};