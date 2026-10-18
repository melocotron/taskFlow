import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainer } from '@shared/ui';

@Component({
  imports: [RouterOutlet, ToastContainer],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
