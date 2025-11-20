import { LaporanDrainaseTersier } from "@/types/laporan-tersier";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export const generatePDFTersier = async (data: LaporanDrainaseTersier): Promise<Blob> => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Laporan Drainase Tersier - ${data.bulan}</title>
      <style>
        @page {
          size: A3 landscape;
          margin: 10mm;
        }

        body {
          font-family: 'Arial', sans-serif;
          font-size: 8pt;
          line-height: 1.3;
          color: #000;
          margin: 0;
          padding: 0;
        }

        .header {
          text-align: center;
          margin-bottom: 10px;
        }

        .header .title {
          font-size: 12pt;
          font-weight: bold;
          margin: 5px 0;
        }

        .header .subtitle {
          font-size: 10pt;
          margin: 3px 0;
        }

        .period {
          margin-bottom: 10px;
          font-size: 10pt;
          font-weight: bold;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }

        table th {
          background-color: #f0f0f0;
          padding: 6px 4px;
          text-align: center;
          font-weight: bold;
          border: 1px solid #000;
          font-size: 7pt;
          vertical-align: middle;
        }

        table td {
          padding: 4px;
          border: 1px solid #000;
          font-size: 7pt;
          vertical-align: top;
        }

        .center {
          text-align: center;
        }

        .no-col {
          width: 25px;
          text-align: center;
        }

        .date-col {
          width: 80px;
        }

        .location-col {
          width: 120px;
        }

        .sedimen-col {
          width: 70px;
        }

        .alat-col {
          width: 90px;
        }

        .number-col {
          width: 35px;
          text-align: center;
        }

        .dimension-col {
          width: 40px;
          text-align: center;
        }

        .target-col {
          width: 50px;
          text-align: center;
        }

        .pic-col {
          width: 100px;
        }

        .note-col {
          width: 70px;
        }

        ul {
          margin: 0;
          padding-left: 15px;
          list-style-type: disc;
        }

        li {
          margin: 2px 0;
        }

        .tenaga-kerja {
          font-size: 7pt;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">Form Laporan Pemeliharaan Drainase Tersier</div>
        <div class="subtitle">(Drainase Lingkungan) oleh P3SU dibantu oleh UPT Dinas SDABMBK Kota Medan</div>
      </div>

      <div class="period">Bulan: ${data.bulan}</div>

      <table>
        <thead>
          <tr>
            <th rowspan="3" class="no-col">No</th>
            <th rowspan="3" class="date-col">Hari/Tanggal</th>
            <th colspan="4">Lokasi</th>
            <th rowspan="3" class="sedimen-col">Jenis Sedimen</th>
            <th rowspan="3" class="alat-col">Alat yang Dibutuhkan</th>
            <th colspan="2" rowspan="2">Kebutuhan Tenaga Kerja</th>
            <th colspan="2">Rencana Dimensi</th>
            <th colspan="2">Realisasi Dimensi</th>
            <th rowspan="3" class="target-col">Sisa Target (Hari)</th>
            <th rowspan="3" class="pic-col">Penanggung Jawab</th>
            <th rowspan="3" class="note-col">Keterangan</th>
          </tr>
          <tr>
            <th rowspan="2">Nama Jalan</th>
            <th rowspan="2">Kecamatan</th>
            <th rowspan="2">Kelurahan</th>
            <th rowspan="2">Kota</th>
            <th rowspan="2" class="dimension-col">Panjang</th>
            <th rowspan="2" class="dimension-col">Volume</th>
            <th rowspan="2" class="dimension-col">Panjang</th>
            <th rowspan="2" class="dimension-col">Volume</th>
          </tr>
          <tr>
            <th class="number-col">UPT</th>
            <th class="number-col">P3SU</th>
          </tr>
        </thead>
        <tbody>
          ${data.kegiatans.map((kegiatan, index) => `
            <tr>
              <td class="center">${index + 1}</td>
              <td>${format(kegiatan.hariTanggal, "EEEE, dd/MM/yyyy", { locale: id })}</td>
              <td>${kegiatan.namaJalan}</td>
              <td>${kegiatan.kecamatan}</td>
              <td>${kegiatan.kelurahan}</td>
              <td class="center">${kegiatan.kota}</td>
              <td>${kegiatan.jenisSedimen || '-'}</td>
              <td>
                ${kegiatan.alatYangDibutuhkan.length > 0
                  ? `<ul>${kegiatan.alatYangDibutuhkan.map(alat => `<li>${alat.nama} (${alat.jumlah})</li>`).join('')}</ul>`
                  : '-'
                }
              </td>
              <td class="center">${kegiatan.uptCount || '-'}</td>
              <td class="center">${kegiatan.p3suCount || '-'}</td>
              <td class="center">${kegiatan.rencanaPanjang || '-'}</td>
              <td class="center">${kegiatan.rencanaVolume || '-'}</td>
              <td class="center">${kegiatan.realisasiPanjang || '-'}</td>
              <td class="center">${kegiatan.realisasiVolume || '-'}</td>
              <td class="center">${kegiatan.sisaTargetHari || '-'}</td>
              <td>${kegiatan.penanggungjawab.join(', ') || '-'}</td>
              <td>${kegiatan.keterangan || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("Popup blocked");
  }

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  await new Promise((resolve) => {
    printWindow.onload = resolve;
  });

  printWindow.print();

  return new Blob([htmlContent], { type: "text/html" });
};
