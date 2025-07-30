// components/client-side-custom-editor.js
'use client' // Required only in App Router.

import dynamic from 'next/dynamic';

const ClientSideCustomEditor = dynamic( () => import( '@/components/custom-editor' ), { ssr: false } );

export default ClientSideCustomEditor;
