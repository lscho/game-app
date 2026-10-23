package com.example.uniappx

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val intent = Intent()
        intent.setClassName(this, "io.dcloud.uniappxv.UniAppActivity")
        startActivity(intent)
        finish()
    }
}
