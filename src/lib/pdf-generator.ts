import { LaporanDrainase } from "@/types/laporan";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Define an extended interface for KegiatanDrainase that includes laporanTanggal
interface KegiatanDrainaseWithLaporanDate extends Omit<LaporanDrainase['kegiatans'][number], 'foto0' | 'foto50' | 'foto100'> {
  foto0: (File | string | null)[];
  foto50: (File | string | null)[];
  foto100: (File | string | null)[];
  laporanTanggal: Date; // Add the missing property
}

// Update the LaporanDrainase type to use the extended KegiatanDrainase for its kegiatans array
interface LaporanDrainaseForPDF extends Omit<LaporanDrainase, 'kegiatans'> {
  kegiatans: KegiatanDrainaseWithLaporanDate[];
}

export const generateDrainaseReportPDF = async (
  data: LaporanDrainaseForPDF, // Use the new extended type here
  reportType: "harian" | "bulanan",
  downloadNow: boolean = true,
  filterPeriod: string | null = null
): Promise<Blob> => {

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
      foto0Base64: await Promise.all(kegiatan.foto0.map(f => getBase64(f))), // Map over array
      foto50Base64: await Promise.all(kegiatan.foto50.map(f => getBase64(f))), // Map over array
      foto100Base64: await Promise.all(kegiatan.foto100.map(f => getBase64(f))), // Map over array
    }))
  );

  const reportTitle = reportType === "harian"
    ? "LAPORAN HARIAN PEMELIHARAAN DRAINASE"
    : "REKAPITULASI LAPORAN HARIAN PEMELIHARAAN DRAINASE";

  const reportPeriodText = reportType === "harian"
    ? `Periode : ${format(data.tanggal || new Date(), "MMMM yyyy", { locale: id })}`
    : `BULAN : ${filterPeriod || format(data.tanggal || new Date(), "MMMM yyyy", { locale: id })}`;

  const fileNameDate = reportType === "harian"
    ? format(data.tanggal || new Date(), "dd MMMM yyyy", { locale: id })
    : filterPeriod || format(data.tanggal || new Date(), "MMMM yyyy", { locale: id });

  const filename = reportType === "harian"
    ? `Laporan Drainase - ${fileNameDate}.pdf`
    : `laporan drainase UPT OPJD Medan Kota ${fileNameDate}.pdf`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${filename}</title>
      <style>
        @page {
          size: A3 landscape;
          margin: 7mm; /* Adjusted margin */
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
          background-color: #fff;
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
          width: 100px; /* Adjusted width to accommodate multiple small images */
          text-align: center;
          padding: 2px;
        }

        .photo-container {
          display: flex;
          flex-wrap: wrap;
          gap: 2px; /* Small gap between images */
          justify-content: center;
        }

        .photo-container img {
          width: 45px; /* Smaller width for multiple images */
          height: 34px; /* Smaller height for multiple images */
          object-fit: cover;
          border: 1px solid #ccc;
        }

        .material-list, .equipment-list {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .material-list li, .equipment-list li {
          margin-bottom: 2px;
          font-size: 6pt;
        }

        .center {
          text-align: center;
        }

        .no-col {
          width: 20px;
          text-align: center;
        }

        .date-col {
          width: 70px;
        }

        .location-col {
          width: 120px;
        }

        .jenis-col {
          width: 50px;
          text-align: center;
        }

        .number-col {
          width: 40px;
          text-align: center;
        }

        .personil-col {
          width: 80px;
        }

        .keterangan-col {
          width: 60px;
        }

        @media print {
          body {
            padding: 0;
          }
          
          @page {
            size: A3 landscape; /* Changed to A3 landscape */
            margin: 7mm; /* Adjusted margin */
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="office">UPT OPERASIONAL PEMELIHARAAN JALAN DAN DRAINASE MEDAN KOTA</div>
        <div class="address">Jl. Garu I No.101, Kelurahan Sitirejo III, Kecamatan Medan Amplas</div>
        <div class="report-title">${reportTitle}</div>
      </div>

      <div class="period">${reportPeriodText}</div>

      <table>
        <thead>
          <tr>
            <th rowspan="2" class="no-col">No</th>
            <th rowspan="2" class="date-col">Hari/ Tanggal</th>
            <th rowspan="2" class="location-col">Lokasi</th>
            <th colspan="3">Foto Dokumentasi</th>
            <th rowspan="2" class="jenis-col">Jenis Saluran<br/>(Terbuka/ Tertutup)</th>
            <th rowspan="2" class="jenis-col">Jenis Sedimen<br/>(Batu/ Padat/Cair)</th>
            <th rowspan="2" style="width: 80px;">Aktifitas Penanganan</th>
            <th rowspan="2" class="number-col">Panjang Penanganan<br/>(meter)</th>
            <th rowspan="2" class="number-col">Lebar Rata-Rata Saluran<br/>(meter)</th>
            <th rowspan="2" class="number-col">Rata-Rata Sedimen<br/>(meter)</th>
            <th rowspan="2" class="number-col">Volume Galian<br/>(meter³)</th>
            <th colspan="4">Material / Bahan</th>
            <th colspan="3">Peralatan & Alat Berat</th>
            <th colspan="2">Personil UPT</th>
            <th rowspan="2" class="keterangan-col">Ket</th>
          </tr>
          <tr>
            <th class="photo-cell">0%</th>
            <th class="photo-cell">50%</th>
            <th class="photo-cell">100%</th>
            <th style="width: 80px;">Jenis</th>
            <th class="number-col">Jlh.</th>
            <th class="number-col">Sat.</th>
            <th class="keterangan-col">Ket. Material</th>
            <th style="width: 80px;">Jenis</th>
            <th class="number-col">Jlh.</th>
            <th class="number-col">Sat.</th>
            <th style="width: 70px;">Koordinator</th>
            <th class="number-col">Jml PHL</th>
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
              <td class="center">${kegiatan.lebarRataRata || '-'}</td>
              <td class="center">${kegiatan.rataRataSedimen || '-'}</td>
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
              <td>${kegiatan.koordinator.join(', ')}</td>
              <td class="center">${kegiatan.jumlahPHL}</td>
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

  // Create blob for preview or download
  const blob = new Blob([htmlContent], { type: 'text/html' });
  
  if (downloadNow) {
    // Open in new window for printing/downloading
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      throw new Error("Popup blocked. Please allow popups for this site.");
    }
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
  
  return blob;
};