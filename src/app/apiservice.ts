import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class Apiservice {
  constructor(private http: HttpClient) { }

  searchOnlineImages(query: string) {
    const apiKey = '55839180-7cf2f2989de478443b7d00ab3';
    const encodedQuery = encodeURIComponent(query);
    const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodedQuery}&image_type=photo&per_page=200`;

    return this.http.get(url);
  }
}