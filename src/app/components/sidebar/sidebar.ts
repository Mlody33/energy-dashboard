import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface MenuItem {
  label: string;
  icon: string;
  routerLink?: string;
  items?: MenuItem[];
  expanded?: boolean;
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  menuItems: MenuItem[] = [
    {
      label: 'DASHBOARDS',
      icon: 'pi pi-chart-bar',
      expanded: true,
      items: [
        { label: 'E-Commerce', icon: 'pi pi-shopping-cart', routerLink: '/dashboard' },
        { label: 'Banking', icon: 'pi pi-credit-card', routerLink: '/banking' }
      ]
    },
    {
      label: 'APPS',
      icon: 'pi pi-th-large',
      expanded: false,
      items: [
        { label: 'Blog', icon: 'pi pi-file-edit', routerLink: '/blog' },
        { label: 'Chat', icon: 'pi pi-comments', routerLink: '/chat' },
        { label: 'Files', icon: 'pi pi-folder', routerLink: '/files' },
        { label: 'Kanban', icon: 'pi pi-bookmark', routerLink: '/kanban' },
        { label: 'Mail', icon: 'pi pi-envelope', routerLink: '/mail' },
        { label: 'Task List', icon: 'pi pi-check-square', routerLink: '/tasks' }
      ]
    },
    {
      label: 'UI KIT',
      icon: 'pi pi-palette',
      expanded: false,
      items: [
        { label: 'Form Layout', icon: 'pi pi-id-card', routerLink: '/form-layout' },
        { label: 'Input', icon: 'pi pi-pencil', routerLink: '/input' },
        { label: 'Button', icon: 'pi pi-mobile', routerLink: '/button' },
        { label: 'Table', icon: 'pi pi-table', routerLink: '/table' },
        { label: 'List', icon: 'pi pi-list', routerLink: '/list' },
        { label: 'Tree', icon: 'pi pi-share-alt', routerLink: '/tree' },
        { label: 'Panel', icon: 'pi pi-tablet', routerLink: '/panel' },
        { label: 'Overlay', icon: 'pi pi-clone', routerLink: '/overlay' },
        { label: 'Media', icon: 'pi pi-image', routerLink: '/media' },
        { label: 'Menu', icon: 'pi pi-bars', routerLink: '/menu' },
        { label: 'Message', icon: 'pi pi-comment', routerLink: '/message' },
        { label: 'File', icon: 'pi pi-file', routerLink: '/file' },
        { label: 'Chart', icon: 'pi pi-chart-bar', routerLink: '/chart' },
        { label: 'Timeline', icon: 'pi pi-calendar', routerLink: '/timeline' },
        { label: 'Misc', icon: 'pi pi-circle-off', routerLink: '/misc' }
      ]
    }
  ];

  toggleMenuItem(item: MenuItem) {
    item.expanded = !item.expanded;
  }
}
