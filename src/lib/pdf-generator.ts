import { LaporanDrainase } from "@/types/laporan";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Define an extended interface for KegiatanDrainase that includes laporanTanggal
export interface KegiatanDrainaseWithLaporanDate extends Omit<LaporanDrainase['kegiatans'][number], 'foto0' | 'foto50' | 'foto100'> {
  foto0: (File | string | null)[];
  foto50: (File | string | null)[];
  foto100: (File | string | null)[];
  laporanTanggal: Date; // Add the missing property
  tanggalKegiatan: string; // Added this property
}

// Update the LaporanDrainase type to use the extended KegiatanDrainase for its kegiatans array
export interface LaporanDrainaseForPDF extends Omit<LaporanDrainase, 'kegiatans'> {
  kegiatans: KegiatanDrainaseWithLaporanDate[];
}

export const generateDrainaseReportPDF = async (
  data: LaporanDrainaseForPDF, // Use the new extended type here
  reportType: "harian" | "bulanan",
  downloadNow: boolean = true,
  filterPeriod: string | null = null // Used for monthly report title
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
    ? `Lap. Harian Drainase UPT OPJD Medan Kota ${fileNameDate}.pdf`
    : `Laporan Bulanan Drainase UPT OPJD Medan Kota ${fileNameDate}.pdf`;

  let htmlContent = '';

  if (reportType === "harian") {
    htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${filename}</title>
        <style>
          @page {
            size: A3 landscape;
            margin: 7mm;
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

          .header .gov-title {
            font-size: 8pt;
            font-weight: bold;
            margin: 0;
          }

          .header .dept-title {
            font-size: 9pt;
            font-weight: bold;
            margin: 2px 0;
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

          .period-info {
            font-size: 8pt;
            font-weight: bold;
            margin-bottom: 2px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 5px;
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
            width: 70px;
            height: 55px;
            text-align: center;
            padding: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            vertical-align: middle;
          }

          .photo-container {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .photo-container img {
            max-width: 65px;
            max-height: 50px;
            object-fit: contain;
            border: 1px solid #ccc;
          }

          .center {
            text-align: center;
          }

          .no-col { width: 20px; text-align: center; }
          .date-col { width: 70px; }
          .location-col { width: 120px; }
          .jenis-col { width: 50px; text-align: center; }
          .number-col { width: 40px; text-align: center; }
          .personil-col { width: 80px; }
          .keterangan-col { width: 60px; }

          .footer-signature {
            margin-top: 20px;
            width: 100%;
            display: flex;
            justify-content: flex-end;
            font-size: 7pt;
          }

          .footer-signature-block {
            text-align: center;
            width: 250px;
          }

          .footer-signature-block p {
            margin: 2px 0;
          }

          .footer-signature-block .name {
            font-weight: bold;
            text-decoration: underline;
          }

          @media print {
            body {
              padding: 0;
            }
            
            @page {
              size: A3 landscape;
              margin: 7mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="gov-title">PEMERINTAH KOTA MEDAN</div>
          <div class="dept-title">DINAS SUMBER DAYA AIR, BINA MARGA DAN BINA KONSTRUKSI</div>
          <div class="office">UPT OPERASIONAL PEMELIHARAAN JALAN DAN DRAINASE MEDAN KOTA</div>
          <div class="address">Jl. Garu I No.101, Kelurahan Sitirejo III, Kecamatan Medan Amplas</div>
          <div class="report-title">${reportTitle}</div>
        </div>

        <div class="period-info">Hari/Tanggal : ${format(data.tanggal || new Date(), "EEEE, dd MMMM yyyy", { locale: id })}</div>
        <div class="period-info">Periode : ${format(data.tanggal || new Date(), "MMMM yyyy", { locale: id })}</div>

        <table>
          <thead>
            <tr>
              <th rowspan="3" class="no-col">No</th>
              <th rowspan="3" class="date-col">Hari/Tanggal</th>
              <th rowspan="3" class="location-col">Lokasi</th>
              <th colspan="3">Foto Dokumentasi</th>
              <th rowspan="3" class="jenis-col">Jenis Saluran (Terbuka/Tertutup)</th>
              <th rowspan="3" class="jenis-col">Jenis Sedimen (Batu/Padat/Cair)</th>
              <th rowspan="3" style="width: 80px;">Aktifitas Penanganan</th>
              <th rowspan="3" class="number-col">Panjang Penanganan (meter)</th>
              <th rowspan="3" class="number-col">Lebar Rata-Rata Saluran (meter)</th>
              <th rowspan="3" class="number-col">Rata-Rata Sedimen (meter)</th>
              <th rowspan="3" class="number-col">Volume Galian (meter³)</th>
              <th colspan="4">Material / Bahan</th>
              <th colspan="3">Peralatan & Alat Berat</th>
              <th colspan="2">Personil UPT</th>
              <th rowspan="3" class="keterangan-col">Ket</th>
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
            <tr>
              <!-- Empty row for rowspan alignment -->
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
                    ${kegiatan.foto0Base64[0] ? `<img src="${kegiatan.foto0Base64[0]}" alt="Foto 0%" />` : ''}
                  </div>
                </td>
                <td class="photo-cell">
                  <div class="photo-container">
                    ${kegiatan.foto50Base64[0] ? `<img src="${kegiatan.foto50Base64[0]}" alt="Foto 50%" />` : ''}
                  </div>
                </td>
                <td class="photo-cell">
                  <div class="photo-container">
                    ${kegiatan.foto100Base64[0] ? `<img src="${kegiatan.foto100Base64[0]}" alt="Foto 100%" />` : ''}
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
                  ${kegiatan.materials.filter(m => m.jenis).map(material => `
                      ${material.jenis}
                    `).join('<br/>')
                }
                </td>
                <td class="center">
                  ${kegiatan.materials.filter(m => m.jenis).map(material => `
                      ${material.jumlah}
                    `).join('<br/>')
                }
                </td>
                <td class="center">
                  ${kegiatan.materials.filter(m => m.jenis).map(material => `
                      ${material.satuan}
                    `).join('<br/>')
                }
                </td>
                <td>
                  ${kegiatan.materials.filter(m => m.jenis).map(material => `
                      ${material.keterangan || '-'}
                    `).join('<br/>')
                }
                </td>
                <td>
                  ${kegiatan.peralatans.filter(p => p.nama).map(peralatan => `
                      ${peralatan.nama}
                    `).join('<br/>')
                }
                </td>
                <td class="center">
                  ${kegiatan.peralatans.filter(p => p.nama).map(peralatan => `
                      ${peralatan.jumlah}
                    `).join('<br/>')
                }
                </td>
                <td class="center">
                  ${kegiatan.peralatans.filter(p => p.nama).map(peralatan => `
                      ${peralatan.satuan || '-'}
                    `).join('<br/>')
                }
                </td>
                <td>
                  ${kegiatan.koordinator.map(koordinator => `
                      ${koordinator}
                    `).join('<br/>')
                }
                </td>
                <td class="center">${kegiatan.jumlahPHL}</td>
                <td>${kegiatan.keterangan || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer-signature">
          <div class="footer-signature-block">
            <p>Medan, ${format(data.tanggal || new Date(), "dd MMMM yyyy", { locale: id })}</p>
            <p>Kepala UPT OPJD Medan Kota</p>
            <br/><br/><br/>
            <p class="name">MOCH EKA INDRAWAN K, S.T</p>
            <p>NIP. 197805052009011001</p>
          </div>
        </div>

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
  } else { // reportType === "bulanan"
    htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${filename}</title>
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

          .header .gov-title {
            font-size: 10pt;
            font-weight: bold;
            margin: 0;
          }

          .header .dept-title {
            font-size: 11pt;
            font-weight: bold;
            margin: 2px 0;
          }

          .header .office {
            margin: 2px 0;
            font-size: 11pt;
            font-weight: bold;
            color: #000;
          }

          .header .address {
            margin: 2px 0;
            font-size: 9pt;
            color: #000;
          }

          .report-title {
            text-align: center;
            font-size: 12pt;
            font-weight: bold;
            margin: 5px 0 10px 0;
            text-transform: uppercase;
          }

          .period-info {
            font-size: 10pt;
            font-weight: bold;
            margin-bottom: 10px;
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

          .material-list, .equipment-list {
            margin: 0;
            padding-left: 15px;
            list-style-type: disc;
          }

          .material-list li, .equipment-list li {
            margin: 2px 0;
          }

          .footer-signature {
            margin-top: 30px;
            width: 100%;
            display: flex;
            justify-content: flex-end;
            font-size: 9pt;
          }

          .footer-signature-block {
            text-align: center;
            width: 300px;
          }

          .footer-signature-block p {
            margin: 3px 0;
          }

          .footer-signature-block .name {
            font-weight: bold;
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="gov-title">PEMERINTAH KOTA MEDAN</div>
          <div class="dept-title">DINAS SUMBER DAYA AIR, BINA MARGA DAN BINA KONSTRUKSI</div>
          <div class="office">UPT OPERASIONAL PEMELIHARAAN JALAN DAN DRAINASE MEDAN KOTA</div>
          <div class="address">Jl. Garu I No.101, Kelurahan Sitirejo III, Kecamatan Medan Amplas</div>
          <div class="report-title">${reportTitle}</div>
        </div>

        <div class="period-info">${reportPeriodText}</div>

        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Tanggal</th>
              <th>Lokasi</th>
              <th>Jenis Saluran</th>
              <th>Jenis Sedimen</th>
              <th>Aktifitas Penanganan</th>
              <th>Panjang Penanganan (m)</th>
              <th>Lebar Rata-Rata (m)</th>
              <th>Rata-Rata Sedimen (m)</th>
              <th>Volume Galian (m³)</th>
              <th>Material</th>
              <th>Peralatan</th>
              <th>Koordinator</th>
              <th>Jumlah PHL</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            ${kegiatansWithImages.map((kegiatan, index) => `
              <tr>
                <td class="center">${index + 1}</td>
                <td>${format(kegiatan.laporanTanggal, "dd/MM/yyyy", { locale: id })}</td>
                <td>${kegiatan.namaJalan}<br/>Kel. ${kegiatan.kelurahan}<br/>Kec. ${kegiatan.kecamatan}</td>
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
                      <li>${material.jenis} (${material.jumlah} ${material.satuan})</li>
                    `).join('')}
                  </ul>
                </td>
                <td>
                  <ul class="equipment-list">
                    ${kegiatan.peralatans.filter(p => p.nama).map(peralatan => `
                      <li>${peralatan.nama} (${peralatan.jumlah} ${peralatan.satuan})</li>
                    `).join('')}
                  </ul>
                </td>
                <td>${kegiatan.koordinator.join(', ') || '-'}</td>
                <td class="center">${kegiatan.jumlahPHL}</td>
                <td>${kegiatan.keterangan || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer-signature">
          <div class="footer-signature-block">
            <p>Medan, ${filterPeriod || format(new Date(), "dd MMMM yyyy", { locale: id })}</p>
            <p>Kepala UPT OPJD Medan Kota</p>
            <br/><br/><br/>
            <p class="name">MOCH EKA INDRAWAN K, S.T</p>
            <p>NIP. 197805052009011001</p>
          </div>
        </div>

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
  }

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