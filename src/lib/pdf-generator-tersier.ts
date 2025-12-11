import { LaporanDrainase, KegiatanDrainase } from "@/types/laporan";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export const generatePDFTersier = async (data: LaporanDrainase, downloadNow: boolean = true): Promise<Blob> => {
  // Convert images to base64
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
      foto0Base64: await Promise.all(kegiatan.foto0.map(f => getBase64(f))),
      foto100Base64: await Promise.all(kegiatan.foto100.map(f => getBase64(f))),
    }))
  );

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Laporan Tersier - ${data.periode}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 10mm;
        }
        body {
          font-family: 'Arial', sans-serif;
          font-size: 8pt;
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
          font-size: 10pt;
          font-weight: bold;
          color: #000;
        }
        .header .address {
          margin: 2px 0;
          font-size: 8pt;
          color: #000;
        }
        .report-title {
          text-align: center;
          font-size: 10pt;
          font-weight: bold;
          margin: 5px 0 10px 0;
          text-transform: uppercase;
        }
        .period {
          margin-bottom: 10px;
          font-size: 9pt;
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
          font-size: 7pt;
          vertical-align: middle;
        }
        table td {
          padding: 3px;
          border: 1px solid #000;
          font-size: 7pt;
          vertical-align: top;
        }
        .photo-main-header-col {
          width: 100px; /* Total width for both photo columns */
          text-align: center;
          padding: 4px 3px;
          border: 1px solid #000;
          vertical-align: middle;
        }
        .photo-sub-header-col {
          width: 50px; /* Half of photo-main-header-col */
          text-align: center;
          padding: 4px 3px;
          border: 1px solid #000;
          vertical-align: middle;
        }
        .photo-cell { /* This will be for the actual image cells in tbody */
          width: 50px; /* Each photo cell takes half the width */
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
        .location-col { width: 120px; }
        .alat-col { width: 80px; }
        .keterangan-col { width: 80px; }

        @media print {
          body {
            padding: 0;
          }
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="office">LAPORAN PELAKSANAAN PEKERJAAN PEMELIHARAAN DRAINASE TERSIER</div>
        <div class="office">UPT OPJD MEDAN KOTA</div>
        <div class="address">DINAS SUMBER DAYA AIR BINA MARGA DAN BINA KONSTRUKSI KOTA MEDAN</div>
        <div class="address">SUMBER DAYA AIR</div>
      </div>

      <div class="period">Periode : ${data.periode}</div>

      <table>
        <thead>
          <tr>
            <th rowspan="2" class="no-col">NO</th>
            <th rowspan="2" class="date-col">HARI/<br/>TANGGAL</th>
            <th rowspan="2" class="location-col">LOKASI</th>
            <th colspan="2" class="photo-main-header-col">FOTO KONDISI EKSISTING</th>
            <th rowspan="2" class="alat-col">ALAT YANG DIBUTUHKAN</th>
            <th rowspan="2">TARGET</th>
            <th rowspan="2">REALISASI</th>
            <th rowspan="2">JUMLAH PERSONIL</th>
            <th rowspan="2" class="keterangan-col">KETERANGAN</th>
          </tr>
          <tr>
            <th class="photo-sub-header-col">Sebelum</th>
            <th class="photo-sub-header-col">Sesudah</th>
          </tr>
        </thead>
        <tbody>
          ${kegiatansWithImages.map((kegiatan, index) => `
            <tr>
              <td class="center">${index + 1}</td>
              <td>${kegiatan.hariTanggal ? format(kegiatan.hariTanggal, "EEEE", { locale: id }) : ''}<br/>${kegiatan.hariTanggal ? format(kegiatan.hariTanggal, "dd/MM/yyyy", { locale: id }) : ''}</td>
              <td>${kegiatan.namaJalan}<br/>Kel. ${kegiatan.kelurahan}<br/>Kec. ${kegiatan.kecamatan}</td>
              <td class="photo-cell">
                <div class="photo-container">
                  ${kegiatan.foto0Base64.map(base64 => base64 ? `<img src="${base64}" alt="Foto 0%" />` : '').join('')}
                </div>
              </td>
              <td class="photo-cell">
                <div class="photo-container">
                  ${kegiatan.foto100Base64.map(base64 => base64 ? `<img src="${base64}" alt="Foto 100%" />` : '').join('')}
                </div>
              </td>
              <td>
                <ul>
                  ${kegiatan.alatYangDibutuhkan?.map(alat => `<li>${alat}</li>`).join('') || '-'}
                </ul>
              </td>
              <td class="center">${kegiatan.rencanaPanjang || '-'} ${kegiatan.rencanaVolume || '-'}</td>
              <td class="center">${kegiatan.realisasiPanjang || '-'} ${kegiatan.realisasiVolume || '-'}</td>
              <td class="center">${kegiatan.jumlahUPT || '-'} ${kegiatan.jumlahP3SU || '-'} ${kegiatan.jumlahPHL || '-'}</td>
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