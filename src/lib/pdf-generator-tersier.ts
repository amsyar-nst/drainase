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
      <title>Form Laporan Pemeliharaan Drainase Tersier - ${data.periode}</title>
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
          text-align: left;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        table th, table td {
          padding: 3px;
          border: 1px solid #000;
          font-size: 6pt;
          vertical-align: middle; /* Changed to middle for better alignment */
          text-align: center; /* Default text align for all cells */
        }

        table th {
          background-color: #f0f0f0;
          font-weight: bold;
        }

        .photo-cell {
          width: 100px; /* Adjusted width for single image */
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
          width: 90px; /* Larger width for single image */
          height: 60px; /* Larger height for single image */
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
          text-align: center; /* Ensure list items are centered */
        }

        .center {
          text-align: center;
        }

        /* Column Widths - Adjusted for better fit */
        .no-col { width: 20px; }
        .hari-tanggal-col { width: 70px; }
        .lokasi-col { width: 100px; }
        .jenis-sedimen-col { width: 60px; }
        .alat-jenis-col { width: 60px; }
        .alat-jumlah-col { width: 30px; }
        .upt-col { width: 30px; }
        .p3su-col { width: 30px; }
        .rencana-panjang-col { width: 40px; }
        .rencana-volume-col { width: 40px; }
        .realisasi-panjang-col { width: 40px; }
        .realisasi-volume-col { width: 40px; }
        .sisa-target-col { width: 40px; }
        .penanggungjawab-col { width: 80px; }
        .keterangan-col { width: 100px; }

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
        <div class="office">UPT OPERASIONAL PEMELIHARAAN JALAN DAN DRAINASE MEDAN KOTA</div>
        <div class="address">Jl. Garu I No.101, Kelurahan Sitirejo III, Kecamatan Medan Amplas</div>
        <div class="report-title">Form Laporan Pemeliharaan Drainase Tersier (Drainase Lingkungan) oleh P3SU dibantu oleh UPT Dinas SDABMBK Kota Medan</div>
      </div>

      <div class="period">Bulan : ${data.periode}</div>

      <table>
        <thead>
          <tr>
            <th rowspan="3" class="no-col">No</th>
            <th rowspan="3" class="hari-tanggal-col">Hari/Tanggal</th>
            <th rowspan="3" class="lokasi-col">Lokasi</th>
            <th colspan="2">Foto Dokumentasi</th>
            <th rowspan="3" class="jenis-sedimen-col">Jenis Sedimen<br/>(Keras, Sedang,Cair)</th>
            <th colspan="2" rowspan="2">Alat yang dibutuhkan</th>
            <th colspan="2" rowspan="2">Orang<br/>Kebutuhan Tenaga<br/>Kerja</th>
            <th colspan="2" rowspan="2">Rencana<br/>Dimensi yang dikerjakan</th>
            <th colspan="2" rowspan="2">Realisasi<br/>Dimensi yang dikerjakan</th>
            <th rowspan="3" class="sisa-target-col">Sisa Target<br/>Penyelesaian<br/>Pekerjaan<br/>(hari)</th>
            <th rowspan="3" class="penanggungjawab-col">Penanggungjawab<br/>Lapangan<br/>(Koordinator)</th>
            <th rowspan="3" class="keterangan-col">Keterangan</th>
          </tr>
          <tr>
            <th colspan="2">Foto Kondisi Eksisting</th>
          </tr>
          <tr>
            <th class="photo-cell">Sebelum</th>
            <th class="photo-cell">Sesudah</th>
            <th class="alat-jenis-col">Jenis</th>
            <th class="alat-jumlah-col">Jumlah</th>
            <th class="upt-col">UPT</th>
            <th class="p3su-col">P3SU</th>
            <th class="rencana-panjang-col">Panjang<br/>(m)</th>
            <th class="rencana-volume-col">Volume<br/>(m³)</th>
            <th class="realisasi-panjang-col">Panjang<br/>(m)</th>
            <th class="realisasi-volume-col">Volume<br/>(m³)</th>
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
              <td class="center">${kegiatan.jenisSedimen || '-'}</td>
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
              <td class="center">${kegiatan.jumlahUPT || '-'}</td>
              <td class="center">${kegiatan.jumlahP3SU || '-'}</td>
              <td class="center">${kegiatan.rencanaPanjang || '-'}</td>
              <td class="center">${kegiatan.rencanaVolume || '-'}</td>
              <td class="center">${kegiatan.realisasiPanjang || '-'}</td>
              <td class="center">${kegiatan.realisasiVolume || '-'}</td>
              <td class="center">${kegiatan.sisaTargetHari || '-'}</td>
              <td>${kegiatan.koordinator.join(', ')}</td>
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