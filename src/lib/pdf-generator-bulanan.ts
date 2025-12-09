import { LaporanBulananData, KegiatanDrainaseBulanan } from "@/types/laporan-bulanan";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export const generatePDFBulanan = async (data: LaporanBulananData): Promise<Blob> => {
  // Convert images to base64
  const getBase64 = async (file: File | string | null): Promise<string> => {
    return new Promise(async (resolve) => {
      if (!file) {
        resolve("");
        return;
      }
      if (typeof file === 'string') {
        // If it's a string, assume it's a URL and fetch its content to convert to base64
        try {
          const response = await fetch(file);
          if (!response.ok) throw new Error(`Failed to fetch image from URL: ${file}`);
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        } catch (error) {
          console.error("Error converting URL to base64:", error);
          resolve(""); // Resolve with empty string on error
        }
        return;
      }
      // If it's a File object, read it as Data URL
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  // Convert all images for all activities
  const kegiatansWithImages = await Promise.all(
    data.kegiatans.map(async (kegiatan) => ({
      ...kegiatan,
      foto0Base64: await Promise.all(kegiatan.foto0.map(f => getBase64(f))),
      foto50Base64: await Promise.all(kegiatan.foto50.map(f => getBase64(f))),
      foto100Base64: await Promise.all(kegiatan.foto100.map(f => getBase64(f))),
    }))
  );

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
          background-color: #f0f0f0; /* Light grey background for headers */
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
          padding: 0; /* Removed padding-left */
          list-style: none; /* Changed to none */
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
        .location-col { width: 150px; } /* Increased width */
        .jenis-saluran-col { width: 50px; }
        .jenis-sedimen-col { width: 50px; }
        .uraian-kegiatan-col { width: 80px; }
        .panjang-col { width: 40px; }
        .volume-col { width: 40px; }
        .material-jenis-col { width: 130px; } /* Increased width */
        .material-jumlah-col { width: 30px; }
        .material-satuan-col { width: 30px; }
        .material-keterangan-col { width: 50px; }
        .peralatan-jenis-col { width: 130px; } /* Increased width */
        .peralatan-jumlah-col { width: 30px; }
        .peralatan-satuan-col { width: 30px; }
        .op-jenis-col { width: 100px; } /* Increased width */
        .op-jumlah-col { width: 30px; }
        .op-fuel-col { width: 30px; } /* For dexlite, pertalite, bio solar jumlah */
        .op-fuel-satuan-col { width: 30px; } /* For dexlite, pertalite, bio solar satuan */
        .op-keterangan-col { width: 60px; } /* New column width */
        .koordinator-col { width: 70px; }
        .phl-col { width: 30px; }
        .keterangan-akhir-col { width: 60px; }

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
            <th colspan="2">VOLUME</th>
            <th colspan="4">BAHAN MATERIAL</th>
            <th colspan="3">PERALATAN</th>
            <th colspan="9">OPERASIONAL ALAT BERAT</th>
            <th colspan="2">JUMLAH PERSONIL</th> <!-- Changed colspan back to 2 -->
            <th rowspan="3" class="keterangan-akhir-col">KETERANGAN</th>
          </tr>
          <tr>
            <th rowspan="2" class="photo-cell">0%</th>
            <th rowspan="2" class="photo-cell">50%</th>
            <th rowspan="2" class="photo-cell">100%</th>
            <th rowspan="2" class="panjang-col">PANJANG<br/>(M)</th>
            <th rowspan="2" class="volume-col">(M³)</th>
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
            <th rowspan="2" class="phl-col">PHL</th> <!-- Changed back to PHL -->
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
          ${kegiatansWithImages.map((kegiatan, index) => `
            <tr>
              <td class="center">${index + 1}</td>
              <td>${format(kegiatan.laporanTanggal, "EEEE", { locale: id })}<br/>${format(kegiatan.laporanTanggal, "dd/MM/yyyy", { locale: id })}</td>
              <td>${kegiatan.namaJalan}<br/>Kel. ${kegiatan.kelurahan}<br/>Kec. ${kegiatan.kecamatan}</td>
              <td class="photo-cell">
                <div class="photo-container">
                  ${kegiatan.foto0Base64.map(base64 => base64 ? `<img src="${base64}" alt="Foto 0%" />` : '').join('')}
                </div>
              </td>
              <td class="photo-cell">
                <div class="photo-container">
                  ${kegiatan.foto50Base64.map(base64 => base64 ? `<img src="${base64}" alt="Foto 50%" />` : '').join('')}
                </div>
              </td>
              <td class="photo-cell">
                <div class="photo-container">
                  ${kegiatan.foto100Base64.map(base64 => base64 ? `<img src="${base64}" alt="Foto 100%" />` : '').join('')}
                </div>
              </td>
              <td class="center">${kegiatan.jenisSaluran || '-'}</td>
              <td class="center">${kegiatan.jenisSedimen || '-'}</td>
              <td>${kegiatan.aktifitasPenanganan}</td>
              <td class="center">${kegiatan.panjangPenanganan || '-'}</td>
              <td class="center">${kegiatan.volumeGalian || '-'}</td>
              <td>
                <ul class="material-list">
                  ${kegiatan.materials.filter(m => m.jenis).map(material => `
                    <li>${material.jenis}</li>
                  `).join('')}
                </ul>
              </td>
              <td class="center">
                <ul class="material-list">
                  ${kegiatan.materials.filter(m => m.jenis).map(material => `
                    <li>${material.jumlah}</li>
                  `).join('')}
                </ul>
              </td>
              <td class="center">
                <ul class="material-list">
                  ${kegiatan.materials.filter(m => m.jenis).map(material => `
                    <li>${material.satuan}</li>
                  `).join('')}
                </ul>
              </td>
              <td>
                <ul class="material-list">
                  ${kegiatan.materials.filter(m => m.jenis).map(material => `
                    <li>${material.keterangan || '-'}</li>
                  `).join('')}
                </ul>
              </td>
              <td>
                <ul class="equipment-list">
                  ${kegiatan.peralatans.filter(p => p.nama).map(peralatan => `
                    <li>${peralatan.nama}</li>
                  `).join('')}
                </ul>
              </td>
              <td class="center">
                <ul class="equipment-list">
                  ${kegiatan.peralatans.filter(p => p.nama).map(peralatan => `
                    <li>${peralatan.jumlah}</li>
                  `).join('')}
                </ul>
              </td>
              <td class="center">
                <ul class="equipment-list">
                  ${kegiatan.peralatans.filter(p => p.nama).map(peralatan => `
                    <li>${peralatan.satuan || '-'}</li>
                  `).join('')}
                </ul>
              </td>
              <td>
                <ul class="equipment-list">
                  ${kegiatan.operasionalAlatBerats.filter(o => o.jenis).map(op => `
                    <li>${op.jenis}</li>
                  `).join('')}
                </ul>
              </td>
              <td class="center">
                <ul class="equipment-list">
                  ${kegiatan.operasionalAlatBerats.filter(o => o.jenis).map(op => `
                    <li>${op.jumlah}</li>
                  `).join('')}
                </ul>
              </td>
              <td class="center">
                <ul class="equipment-list">
                  ${kegiatan.operasionalAlatBerats.filter(o => o.jenis).map(op => `
                    <li>${op.dexliteJumlah || '-'}</li>
                  `).join('')}
                </ul>
              </td>
              <td class="center">
                <ul class="equipment-list">
                  ${kegiatan.operasionalAlatBerats.filter(o => o.jenis).map(op => `
                    <li>${op.dexliteSatuan || '-'}</li>
                  `).join('')}
                </ul>
              </td>
              <td class="center">
                <ul class="equipment-list">
                  ${kegiatan.operasionalAlatBerats.filter(o => o.jenis).map(op => `
                    <li>${op.pertaliteJumlah || '-'}</li>
                  `).join('')}
                </ul>
              </td>
              <td class="center">
                <ul class="equipment-list">
                  ${kegiatan.operasionalAlatBerats.filter(o => o.jenis).map(op => `
                    <li>${op.pertaliteSatuan || '-'}</li>
                  `).join('')}
                </ul>
              </td>
              <td class="center">
                <ul class="equipment-list">
                  ${kegiatan.operasionalAlatBerats.filter(o => o.jenis).map(op => `
                    <li>${op.bioSolarJumlah || '-'}</li>
                  `).join('')}
                </ul>
              </td>
              <td class="center">
                <ul class="equipment-list">
                  ${kegiatan.operasionalAlatBerats.filter(o => o.jenis).map(op => `
                    <li>${op.bioSolarSatuan || '-'}</li>
                  `).join('')}
                </ul>
              </td>
              <td> <!-- New TD for Operasional Alat Berat Keterangan -->
                <ul class="equipment-list">
                  ${kegiatan.operasionalAlatBerats.filter(o => o.jenis).map(op => `
                    <li>${op.keterangan || '-'}</li>
                  `).join('')}
                </ul>
              </td>
              <td>${kegiatan.koordinator.join(', ')}</td>
              <td class="center">${kegiatan.jumlahPHL || '-'}</td> <!-- Display PHL count -->
              <td>${kegiatan.keterangan || ''}</td>
            </tr>
          `).join('')}
        </tbody>
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
  
  // Open in new window for printing/downloading
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("Popup blocked. Please allow popups for this site.");
  }
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  return blob;
};