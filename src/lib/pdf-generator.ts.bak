import { LaporanDrainase, KegiatanDrainase, AktifitasPenangananDetail } from "@/types/laporan";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export const generatePDF = async (data: LaporanDrainase, downloadNow: boolean = true): Promise<Blob> => {

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

  // Pre-process the tbody content to avoid complex nested template literals
  const tbodyContent = kegiatansWithImages.map((kegiatan, kegiatanIndex) => {
    const combinedEquipment = [
      ...kegiatan.peralatans.filter(p => p.nama).map(p => ({
        jenis: p.nama,
        jumlah: p.jumlah,
        satuan: p.satuan || '-',
      })),
      ...kegiatan.operasionalAlatBerats.filter(o => o.jenis).map(o => ({
        jenis: o.jenis,
        jumlah: o.jumlah,
        satuan: 'Unit', // Default to 'Unit' for heavy equipment operational count
      })),
    ];

    return kegiatan.aktifitasPenangananDetails.map((detail, detailIndex) => `
      <tr>
        ${detailIndex === 0 ? `
          <td class="center" rowspan="${kegiatan.aktifitasPenangananDetails.length}">${kegiatanIndex + 1}</td>
          <td rowspan="${kegiatan.aktifitasPenangananDetails.length}">${format(data.tanggal || new Date(), "EEEE", { locale: id })}<br/>${format(data.tanggal || new Date(), "dd/MM/yyyy", { locale: id })}</td>
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
        <td class="center">${kegiatan.lebarRataRata || '-'}</td>
        <td class="center">${kegiatan.rataRataSedimen || '-'}</td>
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
              ${combinedEquipment.map(item => `
                <li>${item.jenis}</li>
              `).join('')}
            </ul>
          </td>
          <td class="center" rowspan="${kegiatan.aktifitasPenangananDetails.length}">
            <ul class="equipment-list">
              ${combinedEquipment.map(item => `
                <li>${item.jumlah}</li>
              `).join('')}
            </ul>
          </td>
          <td class="center" rowspan="${kegiatan.aktifitasPenangananDetails.length}">
            <ul class="equipment-list">
              ${combinedEquipment.map(item => `
                <li>${item.satuan || '-'}</li>
              `).join('')}
            </ul>
          </td>
          <td rowspan="${kegiatan.aktifitasPenangananDetails.length}">
            <ul class="koordinator-list">
              ${kegiatan.koordinator.map(name => `<li>${name}</li>`).join('')}
            </ul>
          </td>
          <td class="center" rowspan="${kegiatan.aktifitasPenangananDetails.length}">${kegiatan.jumlahPHL || '-'}</td>
          <td rowspan="${kegiatan.aktifitasPenangananDetails.length}">${kegiatan.keterangan || ''}</td>
        ` : ''}
      </tr>
    `).join('')
  }).join('');


  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Laporan Drainase - ${format(data.tanggal || new Date(), "dd MMMM yyyy", { locale: id })}</title>
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
          width: 100px;
          text-align: center;
          padding: 2px;
        }

        .photo-container {
          text-align: center; /* Changed from display: flex */
        }

        .photo-container img {
          width: 47px; /* Adjusted for two images side-by-side */
          height: 47px; /* Adjusted for two images side-by-side */
          object-fit: cover;
          border: 1px solid #ccc;
          display: inline-block; /* Added for side-by-side layout */
          margin: 1px; /* Added for spacing between images */
        }

        .material-list, .equipment-list, .koordinator-list { /* Added .koordinator-list */
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .material-list li, .equipment-list li, .koordinator-list li { /* Added .koordinator-list li */
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
        <div class="report-title">LAPORAN HARIAN PEMELIHARAAN DRAINASE</div>
      </div>

      <div class="period">Periode : ${format(data.tanggal || new Date(), "MMMM yyyy", { locale: id })}</div>

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
          ${tbodyContent}
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