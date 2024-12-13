import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

export default function About() {
  return (
    <Layout title="About" description="Page about Maksim Zemlianikin">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <div style={{
          padding: "10px",
          maxWidth: '600px',
          display: 'flex',
          alignItems: 'center',
          flexDirection: "column",
          fontSize: '20px',
        }}>
          <img
            src='img/me.png'
            style={{
              borderRadius: '50%',
              height: 150,
              width: 150,
              margin: "0 0 10px 0",
            }} />
          <h1 style={{ fontSize: '50px' }}>Maksim Zemlianikin</h1>
          <div style={{ lineHeight: '1.2' }}>
            <p>
              Hey👋🏻
            </p>
            <p>
              I work as a Flutter developer. Besides work, I like to watch films, learn science
              and do some sports and pet projects
            </p>
            <h2>Some links:</h2>
            <ul >
              <li>
                <Link to="/blog">Blog</Link> - articles about Flutter and programming in general
              </li>
              <li>
                <Link to="https://github.com/Maksimka101">GitHub</Link> with my open source projects and packages
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}