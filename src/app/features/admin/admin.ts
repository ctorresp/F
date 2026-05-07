import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../core/services/report.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-admin',
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class AdminPage implements OnInit {
  constructor(public readonly reportService: ReportService) {}

  ngOnInit(): void {
    this.reportService.loadAllReports().subscribe();
  }
}
