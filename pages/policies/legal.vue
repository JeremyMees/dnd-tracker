<template>
  <NuxtLayout container>
    <div class="space-y-4">
      <h1>Legal Information</h1>
      <p>This site uses content provided under the Open Gaming License (OGL) Version 1.0a. Below is the required legal information, including the OGL text itself and any copyright notices relevant to the content sourced from Open5e and other OGL resources. Please read and understand the terms of this license before using this material.</p>
      <h2>Open Gaming License Notice</h2>
      <p>
        Permission to copy, modify, and distribute the content available on this site is granted solely through the use of the
        <a
          href="https://opengamingfoundation.org/ogl.html"
          target="_blank"
        >Open Gaming License, Version 1.0a</a>.
      </p>
      <p>
        This material is being released using the Open Gaming License Version 1.0a, and you should read and understand the terms of that license before using this material.
      </p>
      <p>
        The text of the Open Gaming License itself is not Open Game Content. Instructions on using the License are provided within the License itself.
      </p>
      <p>
        All game content on this site identified as Open Game Content is released under the Open Gaming License Version 1.0a. Please refer to the section on Open Game Content below for more details.
      </p>
      <h2>Open Game Content (OGC)</h2>
      <p>
        All data sourced from Open5e, which includes rules, statistics, creatures, spells, and other gaming content, is Open Game Content as defined under the Open Gaming License (OGL) Version 1.0a. This site complies with the OGL terms by properly attributing this content to its original creators.
      </p>
      <p>
        Note: No Product Identity content, as defined by the OGL, is included or claimed as original work by this site. Product Identity includes specific names, images, logos, and trademarked material, which remain the intellectual property of their respective owners.
      </p>
      <h2>
        Copyright Notices
      </h2>
      <p>
        Below are copyright notices required by the Open Gaming License to acknowledge the original creators and sources of Open Game Content.
      </p>
      <ul>
        <li>
          Open Gaming License v1.0a Copyright 2000, Wizards of the Coast, Inc.
        </li>
        <li>
          System Reference Document 5.1 Copyright 2016, Wizards of the Coast, Inc.; Authors Mike Mearls, Jeremy Crawford, Chris Perkins, Rodney Thompson, Peter Lee, James Wyatt, Robert J. Schwalb, Bruce R. Cordell, Chris Sims, and Steve Townshend, based on original material by E. Gary Gygax and Dave Arneson.
        </li>
        <li>
          Creature Codex © 2018 Open Design LLC; Authors Wolfgang Baur, Dan Dillon, Richard Green, James Haeck, Chris Harris, Jeremy Hochhalter, James Introcaso, Chris Lockey, Shawn Merwin, and Jon Sawatsky.
        </li>
        <li>
          Tome of Beasts Copyright 2016, Open Design; Authors Chris Harris, Dan Dillon, Rodrigo Garcia Carmona, and Wolfgang Baur.
        </li>
        <li>
          Open5e Data Copyright 2019, Open5e.com.
        </li>
      </ul>
    </div>
  </NuxtLayout>
</template>

<style scoped>
p {
  @apply max-w-prose;
}

h2 {
  @apply pt-8;
}

ul {
  @apply list-disc pl-5 max-w-prose;
}

a {
  @apply inline text-primary underline;
}
</style>
