import { Component, OnInit } from '@angular/core';
import { FileUpload } from '../shared/file-upload';
import { UploadFileService } from '../shared/upload-file.service';
import * as _ from 'lodash';
import { AngularFireStorage, AngularFireUploadTask } from 'angularfire2/storage';
import { AngularFirestore } from 'angularfire2/firestore';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-upload-form',
  templateUrl: './upload-form.component.html',
  styleUrls: ['./upload-form.component.css']
})
export class UploadFormComponent implements OnInit {
  //Main task
  task: AngularFireUploadTask;
  //Progress monitoring
  percentage: Observable<number>;
  snapshot: Observable<any>;
  //Download url
  downloadURL: Observable<string>;
  //State for dorpzone CSS toggling
  isHovering: boolean;

  constructor(private storage: AngularFireStorage, private db: AngularFirestore) { }

  ngOnInit(): void {
  }

  toggleHover(event: boolean) {
    this.isHovering = event;
  }

  startUpload(event: FileList) {
    //The file object
    const file = event.item(0);
    // Client-side validation example
    if (file.type.split('/')[0] !== 'image') {
      console.error('unsupported file type :(');
      return;
    }

    // the storage path
    const path = `test/${new Date().getTime()}_${file.name}`;
    const ref = this.storage.ref(path);

    //Totaly optional metadata
    const customMetadata = { app: 'My AngularFire-powered PWA!' };

    //The main task
    this.task = this.storage.upload(path, file, { customMetadata });
    this.percentage = this.task.percentageChanges();

    this.snapshot = this.task.snapshotChanges().pipe(
      tap(snap => {
        if (snap.bytesTransferred === snap.totalBytes) {
          this.db.collection('photos').add({ path, size: snap.totalBytes });
          this.downloadURL = ref.getDownloadURL();
        }
      })
    );
  }

  isActive(snapshot) {
    return snapshot.state === 'running' && snapshot.bytesTransferred < snapshot.totalBytes;
  }

}
